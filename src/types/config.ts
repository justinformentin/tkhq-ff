export type Environment = 'local' | 'dev' | 'preprod' | 'prod'

export interface AppConfig {
  // Environment identification
  environment: Environment
  appName: string
  version: string
  
  // API Configuration
  operatorAgent: {
    baseUrl: string
    timeout: number
    retries: number
  }
  
  // Authentication
  auth: {
    keycloak: {
      realm: string
      clientId: string
      serverUrl: string
      issuer: string
      redirectUri: string
      scopes: string[]
    }
    session: {
      timeout: number
      refreshThreshold: number
      secret: string
    }
  }
  
  // Feature flags
  features: {
    enableDarkMode: boolean
    enableDebugMode: boolean
    enableMetrics: boolean
  }
  
  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    enableConsole: boolean
    enableRemote: boolean
  }
}

export interface EnvironmentVariables {
  // Next.js public variables (client-side)
  NEXT_PUBLIC_APP_ENV: Environment
  NEXT_PUBLIC_APP_NAME: string
  NEXT_PUBLIC_APP_VERSION: string
  NEXT_PUBLIC_KEYCLOAK_REALM: string
  NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: string
  NEXT_PUBLIC_KEYCLOAK_SERVER_URL: string
  NEXT_PUBLIC_KEYCLOAK_ISSUER: string
  NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI: string
  
  // Server-side only variables
  OPERATOR_AGENT_BASE_URL: string
  OPERATOR_AGENT_API_KEY?: string
  SESSION_SECRET: string
  LOG_LEVEL?: string
}
