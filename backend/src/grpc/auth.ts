/**
 * Keycloak ID tokens for the operator agent.
 *
 * The operator agent authenticates callers with an ID token passed in the
 * X-ID-Token header (mono: src/go/tkinfra/internal/keycloak/header.go). tkinfra
 * gets one by refreshing the OAuth token it caches on disk after `tkinfra
 * login`; the ID token itself is never cached, only the refresh token. This
 * does the same thing, reusing the very same cache file so the GUI and the CLI
 * share one login.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

// mono: src/go/tkinfra/internal/keycloak/defaults.go
const DEFAULT_ISSUER =
  'https://keycloak.admin.turnkey.engineering/realms/staff';
const DEFAULT_CLIENT_ID = 'kubelogin';
const CACHE_DIR_NAME = 'tkhq-keycloak';

// Refresh a little early so a token can't expire mid-flight.
const EXPIRY_SKEW_MS = 30_000;

interface CachedToken {
  access_token?: string;
  token_type?: string;
  refresh_token?: string;
  expiry?: string;
  [key: string]: unknown;
}

interface TokenResponse {
  id_token?: string;
  access_token?: string;
  token_type?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

function issuer(): string {
  return process.env.KEYCLOAK_ISSUER || DEFAULT_ISSUER;
}

function clientId(): string {
  return process.env.KEYCLOAK_CLIENT_ID || DEFAULT_CLIENT_ID;
}

/** Mirrors Go's os.UserCacheDir, which is where tkinfra puts the cache. */
function userCacheDir(): string {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Caches');
  }
  return process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
}

function cachePath(): string {
  // --acct selects a non-default account; the cache file is named for it.
  const name = process.env.KEYCLOAK_ACCOUNT || clientId();
  return path.join(userCacheDir(), CACHE_DIR_NAME, name);
}

export class AuthError extends Error {
  constructor(message: string) {
    super(`${message}\nRun \`tkinfra login\` and try again.`);
    this.name = 'AuthError';
  }
}

function readCache(): CachedToken {
  const file = cachePath();

  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    throw new AuthError(`No Keycloak token cache at ${file}.`);
  }

  // tkinfra writes without truncating, so a shorter token can leave trailing
  // bytes from a previous one. Go's json.Decoder reads the first value and
  // ignores the rest; do the same.
  let token: CachedToken;
  try {
    token = JSON.parse(raw.slice(0, raw.indexOf('}\n') + 1) || raw);
  } catch {
    throw new AuthError(`Could not parse the Keycloak token cache at ${file}.`);
  }

  if (!token.refresh_token) {
    throw new AuthError(`No refresh token in the Keycloak cache at ${file}.`);
  }

  return token;
}

/**
 * Persist a rotated refresh token so tkinfra keeps working. Keycloak may issue
 * a new refresh token on every refresh and invalidate the old one — dropping it
 * on the floor would silently log the CLI out.
 */
function writeCache(previous: CachedToken, refreshed: TokenResponse): void {
  const file = cachePath();
  const expiry = refreshed.expires_in
    ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
    : previous.expiry;

  const merged: CachedToken = {
    ...previous,
    access_token: refreshed.access_token ?? previous.access_token,
    token_type: refreshed.token_type ?? previous.token_type,
    refresh_token: refreshed.refresh_token ?? previous.refresh_token,
    expiry,
  };

  try {
    fs.writeFileSync(file, JSON.stringify(merged) + '\n', { mode: 0o600 });
  } catch (err) {
    // Non-fatal: the token we just fetched is still usable for this process.
    console.warn(
      `Warning: could not update the Keycloak token cache at ${file}:`,
      err instanceof Error ? err.message : err
    );
  }
}

let cached: { idToken: string; expiresAt: number } | null = null;
let inFlight: Promise<string> | null = null;

async function refresh(): Promise<string> {
  const previous = readCache();

  const response = await fetch(`${issuer()}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId(),
      refresh_token: previous.refresh_token as string,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as TokenResponse;

  if (!response.ok) {
    throw new AuthError(
      `Keycloak refused to refresh the token (${response.status} ${
        body.error || ''
      } ${body.error_description || ''})`.trim()
    );
  }

  if (!body.id_token) {
    throw new AuthError('Keycloak returned no id_token.');
  }

  if (body.refresh_token && body.refresh_token !== previous.refresh_token) {
    writeCache(previous, body);
  }

  const lifetimeMs = (body.expires_in ?? 300) * 1000;
  cached = {
    idToken: body.id_token,
    expiresAt: Date.now() + lifetimeMs - EXPIRY_SKEW_MS,
  };

  return body.id_token;
}

/** Returns a valid ID token, refreshing only when the cached one is stale. */
export function getIdToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) {
    return Promise.resolve(cached.idToken);
  }

  // Collapse concurrent misses into one refresh — parallel refreshes would
  // race to rotate the same refresh token, and the losers would be rejected.
  if (!inFlight) {
    inFlight = refresh().finally(() => {
      inFlight = null;
    });
  }

  return inFlight;
}
