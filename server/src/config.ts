/**
 * Server configuration — reads from environment variables.
 */

export interface ServerConfig {
  port: number
  sessionSecret: string
  corsOrigin: string[] | undefined
  oidc: {
    issuer: string
    clientId: string
    clientSecret?: string
    redirectUri: string
    scope: string
    idpHint?: string
  }
}

export function getServerConfig(): ServerConfig {
  const issuer = process.env.OIDC_ISSUER || 'https://keycloak.admin.turnkey.engineering/realms/staff'
  const clientId = process.env.OIDC_CLIENT_ID || 'kubelogin'
  const redirectUri = process.env.OIDC_REDIRECT_URI || 'http://localhost:3001/auth/callback'

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    sessionSecret: process.env.SESSION_SECRET || 'local-dev-session-secret',
    corsOrigin: process.env.CORS_ORIGIN?.split(','),
    oidc: {
      issuer,
      clientId,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      redirectUri,
      scope: process.env.OIDC_SCOPE || 'openid profile email offline_access',
      idpHint: process.env.OIDC_IDP_HINT,
    },
  }
}
