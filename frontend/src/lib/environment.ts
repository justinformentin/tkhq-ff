import { createContext, useContext } from 'react';

export type Environment = 'local' | 'dev' | 'preprod' | 'prod';

export const ENVIRONMENTS: Environment[] = ['local', 'dev', 'preprod', 'prod'];

// Writes against these hit real customers, so the UI marks them.
export const PRODUCTION_ENVIRONMENTS: Environment[] = ['preprod', 'prod'];

export const ENVIRONMENT_STORAGE_KEY = 'tkhq-ff.environment';

export interface EnvironmentContextValue {
  env: Environment;
  setEnv: (env: Environment) => void;
  isProduction: boolean;
}

export const EnvironmentContext =
  createContext<EnvironmentContextValue | null>(null);

export function isEnvironment(value: unknown): value is Environment {
  return ENVIRONMENTS.includes(value as Environment);
}

export function useEnvironment(): EnvironmentContextValue {
  const context = useContext(EnvironmentContext);

  if (!context) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }

  return context;
}
