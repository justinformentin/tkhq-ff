export type Environment = 'local' | 'dev' | 'preprod' | 'prod'

export interface AppConfig {
  environment: Environment
  appName: string
  version: string
}
