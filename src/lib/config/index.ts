import type { AppConfig, Environment, EnvironmentVariables } from '@/types/config'

/**
 * Get the current environment from environment variables
 */
export function getEnvironment(): Environment {
  const env = process.env.NEXT_PUBLIC_APP_ENV as Environment
  if (!env || !['local', 'dev', 'preprod', 'prod'].includes(env)) {
    console.warn(`Invalid or missing NEXT_PUBLIC_APP_ENV: ${env}, defaulting to 'local'`)
    return 'local'
  }
  return env
}

/**
 * Validate required environment variables
 * Using static access as required by Next.js
 */
function validateEnvironmentVariables(): EnvironmentVariables {
  const missing: string[] = []

  // Check client-side variables (static access)
  if (!process.env.NEXT_PUBLIC_APP_ENV) missing.push('NEXT_PUBLIC_APP_ENV')
  if (!process.env.NEXT_PUBLIC_APP_NAME) missing.push('NEXT_PUBLIC_APP_NAME')
  if (!process.env.NEXT_PUBLIC_APP_VERSION) missing.push('NEXT_PUBLIC_APP_VERSION')
  if (!process.env.NEXT_PUBLIC_KEYCLOAK_REALM) missing.push('NEXT_PUBLIC_KEYCLOAK_REALM')
  if (!process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID) missing.push('NEXT_PUBLIC_KEYCLOAK_CLIENT_ID')
  if (!process.env.NEXT_PUBLIC_KEYCLOAK_SERVER_URL) missing.push('NEXT_PUBLIC_KEYCLOAK_SERVER_URL')
  if (!process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER) missing.push('NEXT_PUBLIC_KEYCLOAK_ISSUER')
  if (!process.env.NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI) missing.push('NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI')

  // Check server-side variables only on server
  if (typeof window === 'undefined') {
    if (!process.env.OPERATOR_AGENT_BASE_URL) missing.push('OPERATOR_AGENT_BASE_URL')
    if (!process.env.SESSION_SECRET) missing.push('SESSION_SECRET')
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return process.env as unknown as EnvironmentVariables
}

/**
 * Create configuration object from environment variables
 */
function createConfigFromEnv(env: EnvironmentVariables): AppConfig {
  return {
    environment: env.NEXT_PUBLIC_APP_ENV,
    appName: env.NEXT_PUBLIC_APP_NAME,
    version: env.NEXT_PUBLIC_APP_VERSION,
    
    operatorAgent: {
      baseUrl: env.OPERATOR_AGENT_BASE_URL,
      timeout: 30000, // 30 seconds
      retries: 3
    },
    
    auth: {
      keycloak: {
        realm: env.NEXT_PUBLIC_KEYCLOAK_REALM,
        clientId: env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
        serverUrl: env.NEXT_PUBLIC_KEYCLOAK_SERVER_URL,
        issuer: env.NEXT_PUBLIC_KEYCLOAK_ISSUER,
        redirectUri: env.NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI,
        scopes: ['openid', 'profile', 'email', 'roles'] // Based on Go implementation
      },
      session: {
        timeout: 8 * 60 * 60 * 1000, // 8 hours
        refreshThreshold: 5 * 60 * 1000, // 5 minutes
        secret: env.SESSION_SECRET
      }
    },
    
    features: {
      enableDarkMode: true,
      enableDebugMode: env.NEXT_PUBLIC_APP_ENV !== 'prod',
      enableMetrics: env.NEXT_PUBLIC_APP_ENV === 'prod' || env.NEXT_PUBLIC_APP_ENV === 'preprod'
    },
    
    logging: {
      level: (env.LOG_LEVEL as AppConfig['logging']['level']) || 
             (env.NEXT_PUBLIC_APP_ENV === 'prod' ? 'info' : 'debug'),
      enableConsole: env.NEXT_PUBLIC_APP_ENV !== 'prod',
      enableRemote: env.NEXT_PUBLIC_APP_ENV === 'prod' || env.NEXT_PUBLIC_APP_ENV === 'preprod'
    }
  }
}

// Cache for configuration
let cachedConfig: AppConfig | null = null

/**
 * Get the complete application configuration
 */
export function getConfig(): AppConfig {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    const envVars = validateEnvironmentVariables()
    cachedConfig = createConfigFromEnv(envVars)
    return cachedConfig
  } catch (error) {
    console.error('Configuration validation failed:', error)
    console.error('Current environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      hasNextPublicVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')).length
    })
    throw error
  }
}

/**
 * Get client-safe configuration (only public environment variables)
 * Uses consistent approach for both server and client to avoid hydration issues
 */
export function getClientConfig(): Pick<AppConfig, 'environment' | 'appName' | 'version' | 'auth' | 'features'> {
  // Use consistent approach for both server and client to avoid hydration mismatches
  const environment = (process.env.NEXT_PUBLIC_APP_ENV as Environment) || 'local'
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Turnkey Admin Dashboard'
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'
  
  return {
    environment,
    appName,
    version,
    auth: {
      keycloak: {
        realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'staff',
        clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'kubelogin',
        serverUrl: process.env.NEXT_PUBLIC_KEYCLOAK_SERVER_URL || 'https://keycloak.admin.turnkey.engineering',
        issuer: process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER || 'https://keycloak.admin.turnkey.engineering/realms/staff',
        redirectUri: process.env.NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI || 'http://localhost:3000/auth/callback',
        scopes: ['openid', 'profile', 'email', 'roles']
      },
      session: {
        timeout: 8 * 60 * 60 * 1000,
        refreshThreshold: 5 * 60 * 1000,
        secret: '' // Not available on client side
      }
    },
    features: {
      enableDarkMode: true,
      enableDebugMode: environment !== 'prod',
      enableMetrics: environment === 'prod' || environment === 'preprod'
    }
  }
}
