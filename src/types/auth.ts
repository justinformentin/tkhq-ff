export interface OIDCUser {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  groups: string[]
  roles: string[]
  preferred_username?: string
}

export interface AuthSession {
  user: OIDCUser
  isAuthenticated: boolean
  expiresAt: number
  accessToken: string
  refreshToken?: string
  idToken: string
}

export interface TokenPayload {
  sub: string
  email: string
  name: string
  given_name?: string
  family_name?: string
  preferred_username?: string
  groups?: string[]
  roles?: string[]
  exp: number
  iat: number
  iss: string
  aud: string
}

export interface OIDCConfig {
  issuer: string
  clientId: string
  redirectUri: string
  scopes: string[]
  responseType: 'code'
  responseMode?: 'query' | 'fragment'
}

export interface AuthError {
  type: 'AUTH_ERROR' | 'TOKEN_ERROR' | 'SESSION_ERROR' | 'NETWORK_ERROR'
  message: string
  code?: string
  details?: unknown
}
