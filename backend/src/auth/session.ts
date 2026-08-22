/**
 * Server-side login sessions for AUTH_MODE=oidc.
 *
 * Tokens stay on the server; the browser only ever holds an opaque session id
 * in an httpOnly cookie. The store is in-memory, which is fine for the single
 * container this ships as — restarting logs everyone out, and running more
 * than one replica would need a shared store (Redis) instead.
 */
import crypto from 'crypto';
import { OidcConfig, TokenSet, refreshTokens, claimsOf } from './oidc';

export const SESSION_COOKIE = 'tkhq_ff_session';

/** Abandoned logins (opened the tab, never finished) are swept at this age. */
const PENDING_TTL_MS = 10 * 60_000;
/** A session with no requests for this long is dropped. */
const IDLE_TTL_MS = 12 * 60 * 60_000;

interface Session {
  tokens: TokenSet;
  user: ReturnType<typeof claimsOf>;
  lastSeen: number;
  /** Serializes concurrent refreshes so they can't race to rotate the token. */
  refreshing?: Promise<string>;
}

interface Pending {
  codeVerifier: string;
  returnTo: string;
  createdAt: number;
}

const sessions = new Map<string, Session>();
const pending = new Map<string, Pending>();

function sweep() {
  const now = Date.now();

  for (const [state, entry] of pending) {
    if (now - entry.createdAt > PENDING_TTL_MS) pending.delete(state);
  }

  for (const [id, session] of sessions) {
    if (now - session.lastSeen > IDLE_TTL_MS) sessions.delete(id);
  }
}

export function rememberPendingLogin(
  state: string,
  codeVerifier: string,
  returnTo: string
): void {
  sweep();
  pending.set(state, { codeVerifier, returnTo, createdAt: Date.now() });
}

export function consumePendingLogin(state: string): Pending | undefined {
  const entry = pending.get(state);
  // One shot: a replayed callback must not be able to reuse the verifier.
  pending.delete(state);
  return entry;
}

export function createSession(tokens: TokenSet): string {
  const id = crypto.randomBytes(32).toString('base64url');
  sessions.set(id, {
    tokens,
    user: claimsOf(tokens.idToken),
    lastSeen: Date.now(),
  });
  return id;
}

export function getSession(id: string | undefined): Session | undefined {
  if (!id) return undefined;

  const session = sessions.get(id);
  if (session) session.lastSeen = Date.now();

  return session;
}

export function destroySession(id: string | undefined): Session | undefined {
  if (!id) return undefined;

  const session = sessions.get(id);
  sessions.delete(id);

  return session;
}

/**
 * Returns a usable ID token for the session, refreshing it when stale.
 * Throws if the session can no longer be refreshed — the caller should treat
 * that as "log in again".
 */
export function sessionIdToken(
  config: OidcConfig,
  id: string,
  session: Session
): Promise<string> {
  if (Date.now() < session.tokens.expiresAt) {
    return Promise.resolve(session.tokens.idToken);
  }

  if (!session.tokens.refreshToken) {
    sessions.delete(id);
    return Promise.reject(new Error('Session expired.'));
  }

  if (!session.refreshing) {
    session.refreshing = refreshTokens(config, session.tokens.refreshToken)
      .then((tokens) => {
        session.tokens = tokens;
        session.user = claimsOf(tokens.idToken);
        return tokens.idToken;
      })
      .catch((err) => {
        sessions.delete(id);
        throw err;
      })
      .finally(() => {
        session.refreshing = undefined;
      });
  }

  return session.refreshing;
}
