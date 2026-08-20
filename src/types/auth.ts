export interface OIDCUser {
  sub?: string
  email?: string
  name?: string
  username?: string
}

export interface AuthSession {
  isAuthenticated: boolean
  user: OIDCUser | null
}
