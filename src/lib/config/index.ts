import type { AppConfig, Environment } from '@/types/config'

export function getConfig(): AppConfig {
  const env = (import.meta.env.VITE_APP_ENV as Environment) || 'local'
  return {
    environment: ['local', 'dev', 'preprod', 'prod'].includes(env) ? env : 'local',
    appName: import.meta.env.VITE_APP_NAME || 'Turnkey Admin Dashboard',
    version: import.meta.env.VITE_APP_VERSION || '0.1.0',
  }
}
