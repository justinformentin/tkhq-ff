/**
 * OpenID Connect authorization-code flow with PKCE, for deployed instances.
 *
 * Local development doesn't use this: there, the backend borrows the token
 * `tkinfra login` already cached on the developer's machine (see
 * ../grpc/auth.ts). That cache doesn't exist on a server, and sharing one
 * would give every visitor a single person's identity — so a deployment logs
 * each user in through Keycloak and calls the operator agent as them.
 */
import crypto from 'crypto';
import { OAuthErrorBody, readTokenBody, tokenErrorDetail } from './oauth';

const DEFAULT_ISSUER =
  'https://keycloak.admin.turnkey.engineering/realms/staff';

// tkinfra's CLI client, and the only one that exists today. It accepts exactly
// one redirect URI — its loopback listener — so locally we borrow both.
// mono: src/go/tkinfra/internal/keycloak/defaults.go
const LOOPBACK_CLIENT_ID = 'kubelogin';
export const LOOPBACK_ADDRESS = 'localhost:36987';
const LOOPBACK_REDIRECT_URI = `http://${LOOPBACK_ADDRESS}`;

export interface OidcConfig {
  issuer: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scope: string;
  /** Skips Keycloak's chooser and goes straight to an identity provider. */
  idpHint?: string;
  /**
   * True when the callback lands on a loopback listener this process owns
   * rather than on a route of the deployed app.
   */
  loopback: boolean;
}

export interface TokenSet {
  idToken: string;
  refreshToken?: string;
  /** Epoch ms at which idToken stops being usable. */
  expiresAt: number;
}

interface DiscoveryDocument {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
}

interface TokenEndpointResponse extends OAuthErrorBody {
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

export class OidcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OidcError';
  }
}

/**
 * Deployed instances register their own Keycloak client and receive the
 * callback on their own host. With none configured we fall back to the
 * loopback flow, which only works because the backend is on the same machine
 * as the browser — i.e. local development.
 */
export function getOidcConfig(): OidcConfig {
  const clientId = process.env.OIDC_CLIENT_ID;
  const redirectUri = process.env.OIDC_REDIRECT_URI;
  const loopback = !clientId || !redirectUri;

  return {
    issuer: process.env.KEYCLOAK_ISSUER || DEFAULT_ISSUER,
    clientId: clientId || LOOPBACK_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    redirectUri: redirectUri || LOOPBACK_REDIRECT_URI,
    loopback,
    // offline_access keeps the refresh token alive past the browser session,
    // so a long-lived tab doesn't get bounced back to Keycloak mid-edit.
    scope: process.env.OIDC_SCOPE || 'openid profile email offline_access',
    idpHint: process.env.OIDC_IDP_HINT,
  };
}

let discovery: Promise<DiscoveryDocument> | null = null;

function discover(issuer: string): Promise<DiscoveryDocument> {
  if (!discovery) {
    discovery = fetch(`${issuer}/.well-known/openid-configuration`)
      .then(async (res) => {
        if (!res.ok) {
          throw new OidcError(
            `OIDC discovery failed for ${issuer} (${res.status})`
          );
        }
        return (await res.json()) as DiscoveryDocument;
      })
      .catch((err) => {
        discovery = null; // Don't cache a failure.
        throw err;
      });
  }

  return discovery;
}

export interface PendingLogin {
  state: string;
  codeVerifier: string;
  returnTo: string;
}

export function startLogin(returnTo: string): PendingLogin {
  return {
    state: crypto.randomBytes(24).toString('base64url'),
    codeVerifier: crypto.randomBytes(32).toString('base64url'),
    returnTo,
  };
}

export async function authorizationUrl(
  config: OidcConfig,
  pending: PendingLogin
): Promise<string> {
  const { authorization_endpoint } = await discover(config.issuer);

  const challenge = crypto
    .createHash('sha256')
    .update(pending.codeVerifier)
    .digest('base64url');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    state: pending.state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  if (config.idpHint) params.set('kc_idp_hint', config.idpHint);

  return `${authorization_endpoint}?${params}`;
}

async function callTokenEndpoint(
  config: OidcConfig,
  body: Record<string, string>
): Promise<TokenSet> {
  const { token_endpoint } = await discover(config.issuer);

  const params = new URLSearchParams({
    client_id: config.clientId,
    ...body,
  });

  if (config.clientSecret) params.set('client_secret', config.clientSecret);

  const response = await fetch(token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const result = await readTokenBody<TokenEndpointResponse>(response);

  if (!response.ok) {
    throw new OidcError(
      `Keycloak rejected the token request ` +
        `(${tokenErrorDetail(response.status, result)})`
    );
  }

  if (!result.id_token) {
    throw new OidcError('Keycloak returned no id_token.');
  }

  return {
    idToken: result.id_token,
    refreshToken: result.refresh_token,
    // Refresh a little early so a token can't expire mid-flight.
    expiresAt: Date.now() + (result.expires_in ?? 300) * 1000 - 30_000,
  };
}

export function exchangeCode(
  config: OidcConfig,
  code: string,
  codeVerifier: string
): Promise<TokenSet> {
  return callTokenEndpoint(config, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });
}

export function refreshTokens(
  config: OidcConfig,
  refreshToken: string
): Promise<TokenSet> {
  return callTokenEndpoint(config, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
}

export async function logoutUrl(
  config: OidcConfig,
  idToken: string,
  returnTo: string
): Promise<string | null> {
  const { end_session_endpoint } = await discover(config.issuer);
  if (!end_session_endpoint) return null;

  const params = new URLSearchParams({
    id_token_hint: idToken,
    post_logout_redirect_uri: returnTo,
  });

  return `${end_session_endpoint}?${params}`;
}

/** Claims we surface to the UI. The token is otherwise never sent to a browser. */
export function claimsOf(idToken: string): {
  username?: string;
  email?: string;
  name?: string;
} {
  try {
    const [, encodedPayload] = idToken.split('.');
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString()
    );

    return {
      username: payload.preferred_username,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return {};
  }
}
