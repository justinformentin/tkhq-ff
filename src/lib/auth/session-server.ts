import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { getConfig } from '@/lib/config'
import type { AuthSession, OIDCUser } from '@/types/auth'

export interface SessionData {
  user?: OIDCUser
  isAuthenticated?: boolean
  expiresAt?: number
  // Store only refresh token, access token can be refreshed as needed
  refreshToken?: string
}

/**
 * Get session configuration
 */
function getSessionConfig() {
  const config = getConfig()
  return {
    password: config.auth.session.secret,
    cookieName: `turnkey-admin-session-${config.environment}`, // Environment-specific cookie names
    cookieOptions: {
      secure: config.environment === 'prod',
      httpOnly: true,
      sameSite: 'lax' as const,
      maxAge: config.auth.session.timeout / 1000, // Convert to seconds
    },
  }
}

/**
 * Get the current session (server-side only)
 */
export async function getServerSession(): Promise<IronSession<SessionData>> {
  const sessionConfig = getSessionConfig()
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionConfig)
}

/**
 * Create a new authenticated session
 * Only store user info and refresh token to keep cookie size small
 */
export async function createSession(
  user: OIDCUser,
  accessToken: string,
  idToken: string,
  refreshToken?: string
): Promise<void> {
  const session = await getServerSession()
  const config = getConfig()
  
  const expiresAt = Date.now() + config.auth.session.timeout
  
  session.user = user
  session.isAuthenticated = true
  session.expiresAt = expiresAt
  session.refreshToken = refreshToken
  
  await session.save()
}

/**
 * Update existing session with new tokens
 */
export async function updateSession(
  accessToken: string,
  idToken: string,
  refreshToken?: string
): Promise<void> {
  const session = await getServerSession()
  const config = getConfig()
  
  if (!session.isAuthenticated) {
    throw new Error('No active session to update')
  }
  
  const expiresAt = Date.now() + config.auth.session.timeout
  
  session.expiresAt = expiresAt
  if (refreshToken) {
    session.refreshToken = refreshToken
  }
  
  await session.save()
}

/**
 * Check if current session is valid and not expired
 */
export async function isSessionValid(): Promise<boolean> {
  const session = await getServerSession()
  
  if (!session.isAuthenticated || !session.expiresAt) {
    return false
  }
  
  return Date.now() < session.expiresAt
}

/**
 * Get current authenticated user (server-side only)
 */
export async function getCurrentUser(): Promise<OIDCUser | null> {
  const session = await getServerSession()
  
  if (!session.isAuthenticated || !session.user) {
    return null
  }
  
  const isValid = await isSessionValid()
  if (!isValid) {
    return null
  }
  
  return session.user
}

/**
 * Check if session needs refresh based on threshold
 */
export async function shouldRefreshSession(): Promise<boolean> {
  const session = await getServerSession()
  const config = getConfig()
  
  if (!session.isAuthenticated || !session.expiresAt) {
    return false
  }
  
  const timeUntilExpiry = session.expiresAt - Date.now()
  return timeUntilExpiry < config.auth.session.refreshThreshold
}

/**
 * Get access token from session
 * Note: Access tokens are not stored in session anymore due to size constraints
 * Use refresh token to get new access token when needed
 */
export async function getAccessToken(): Promise<string | null> {
  // Access tokens are no longer stored in session
  // Would need to refresh using refresh token
  return null
}

/**
 * Get refresh token from session
 */
export async function getRefreshToken(): Promise<string | null> {
  const session = await getServerSession()
  
  if (!session.isAuthenticated || !session.refreshToken) {
    return null
  }
  
  return session.refreshToken
}

/**
 * Clear session (logout)
 */
export async function clearSession(): Promise<void> {
  const session = await getServerSession()
  
  session.user = undefined
  session.isAuthenticated = false
  session.expiresAt = undefined
  session.refreshToken = undefined
  
  await session.save()
}

/**
 * Convert session data to AuthSession interface
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  const session = await getServerSession()
  
  if (!session.isAuthenticated || !session.user || !session.expiresAt) {
    return null
  }
  
  const isValid = await isSessionValid()
  if (!isValid) {
    return null
  }
  
  return {
    user: session.user,
    isAuthenticated: session.isAuthenticated,
    expiresAt: session.expiresAt,
    accessToken: '', // Not stored in session anymore
    refreshToken: session.refreshToken,
    idToken: '', // Not stored in session anymore
  }
}
