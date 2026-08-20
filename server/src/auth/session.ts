/**
 * Server-side login sessions.
 * Tokens stay on the server; the browser only ever holds an opaque session id
 * in an httpOnly cookie. In-memory store — restarting logs everyone out.
 * Mirrors tkhq-ff backend/src/auth/session.ts.
 */
import crypto from 'crypto'
import { TokenSet, claimsOf } from './keycloak.js'

export const SESSION_COOKIE = 'admin_dashboard_session'

const PENDING_TTL_MS = 10 * 60_000   // 10 min — abandoned logins
const IDLE_TTL_MS = 12 * 60 * 60_000 // 12 hours

interface Session {
  tokens: TokenSet
  user: ReturnType<typeof claimsOf>
  lastSeen: number
}

interface Pending {
  codeVerifier: string
  returnTo: string
  createdAt: number
}

const sessions = new Map<string, Session>()
const pending = new Map<string, Pending>()

function sweep() {
  const now = Date.now()
  for (const [state, entry] of pending) {
    if (now - entry.createdAt > PENDING_TTL_MS) pending.delete(state)
  }
  for (const [id, session] of sessions) {
    if (now - session.lastSeen > IDLE_TTL_MS) sessions.delete(id)
  }
}

export function rememberPendingLogin(state: string, codeVerifier: string, returnTo: string): void {
  sweep()
  pending.set(state, { codeVerifier, returnTo, createdAt: Date.now() })
}

export function consumePendingLogin(state: string): Pending | undefined {
  const entry = pending.get(state)
  pending.delete(state) // one-shot
  return entry
}

export function createSession(tokens: TokenSet): string {
  const id = crypto.randomBytes(32).toString('base64url')
  sessions.set(id, {
    tokens,
    user: claimsOf(tokens.idToken),
    lastSeen: Date.now(),
  })
  return id
}

export function getSession(id: string | undefined): Session | undefined {
  if (!id) return undefined
  const session = sessions.get(id)
  if (session) session.lastSeen = Date.now()
  return session
}

export function destroySession(id: string | undefined): Session | undefined {
  if (!id) return undefined
  const session = sessions.get(id)
  sessions.delete(id)
  return session
}
