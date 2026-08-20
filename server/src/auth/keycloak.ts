/**
 * OpenID Connect authorization-code flow with PKCE.
 * Mirrors tkhq-ff backend/src/auth/oidc.ts.
 */
import crypto from 'crypto'

export interface OidcConfig {
  issuer: string
  clientId: string
  clientSecret?: string
  redirectUri: string
  scope: string
  idpHint?: string
}

export interface TokenSet {
  idToken: string
  refreshToken?: string
  /** Epoch ms at which idToken stops being usable. */
  expiresAt: number
}

interface DiscoveryDocument {
  authorization_endpoint: string
  token_endpoint: string
  end_session_endpoint?: string
}

interface TokenEndpointResponse {
  id_token?: string
  refresh_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

export class OidcError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OidcError'
  }
}

let discovery: Promise<DiscoveryDocument> | null = null

function discover(issuer: string): Promise<DiscoveryDocument> {
  if (!discovery) {
    discovery = fetch(`${issuer}/.well-known/openid-configuration`)
      .then(async (res) => {
        if (!res.ok) {
          throw new OidcError(`OIDC discovery failed for ${issuer} (${res.status})`)
        }
        return (await res.json()) as DiscoveryDocument
      })
      .catch((err) => {
        discovery = null // Don't cache a failure
        throw err
      })
  }
  return discovery
}

export interface PendingLogin {
  state: string
  codeVerifier: string
  returnTo: string
}

export function startLogin(returnTo: string): PendingLogin {
  return {
    state: crypto.randomBytes(24).toString('base64url'),
    codeVerifier: crypto.randomBytes(32).toString('base64url'),
    returnTo,
  }
}

export async function authorizationUrl(config: OidcConfig, pending: PendingLogin): Promise<string> {
  const { authorization_endpoint } = await discover(config.issuer)

  const challenge = crypto
    .createHash('sha256')
    .update(pending.codeVerifier)
    .digest('base64url')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    state: pending.state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  if (config.idpHint) params.set('kc_idp_hint', config.idpHint)

  return `${authorization_endpoint}?${params}`
}

async function callTokenEndpoint(config: OidcConfig, body: Record<string, string>): Promise<TokenSet> {
  const { token_endpoint } = await discover(config.issuer)

  const params = new URLSearchParams({
    client_id: config.clientId,
    ...body,
  })
  if (config.clientSecret) params.set('client_secret', config.clientSecret)

  const response = await fetch(token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })

  const result = (await response.json().catch(() => ({}))) as TokenEndpointResponse

  if (!response.ok) {
    const detail = [response.status, result.error, result.error_description]
      .filter(Boolean)
      .join(' ')
    throw new OidcError(`Keycloak rejected the token request (${detail})`)
  }

  if (!result.id_token) {
    throw new OidcError('Keycloak returned no id_token.')
  }

  return {
    idToken: result.id_token,
    refreshToken: result.refresh_token,
    expiresAt: Date.now() + (result.expires_in ?? 300) * 1000 - 30_000,
  }
}

export function exchangeCode(config: OidcConfig, code: string, codeVerifier: string): Promise<TokenSet> {
  return callTokenEndpoint(config, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  })
}

export async function logoutUrl(
  config: OidcConfig,
  idToken: string,
  returnTo: string
): Promise<string | null> {
  const { end_session_endpoint } = await discover(config.issuer)
  if (!end_session_endpoint) return null

  const params = new URLSearchParams({
    id_token_hint: idToken,
    post_logout_redirect_uri: returnTo,
  })
  return `${end_session_endpoint}?${params}`
}

/** Claims we surface to the UI. The token is otherwise never sent to a browser. */
export function claimsOf(idToken: string): {
  username?: string
  email?: string
  name?: string
  sub?: string
} {
  try {
    const [, encodedPayload] = idToken.split('.')
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString())
    return {
      sub: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
      name: payload.name,
    }
  } catch {
    return {}
  }
}
