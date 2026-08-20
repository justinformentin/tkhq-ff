import { useCallback, useMemo, useState } from 'react';
import {
  ENVIRONMENT_STORAGE_KEY,
  EnvironmentContext,
  PRODUCTION_ENVIRONMENTS,
  isEnvironment,
  type Environment,
} from '../lib/environment';

/**
 * The environment survives reloads: it's the frame for everything on screen,
 * and silently resetting to local after a refresh would make the page lie
 * about which environment you're looking at. ?env= wins over the stored value
 * so a shared link opens where the sender meant.
 */
function initialEnvironment(): Environment {
  const fromUrl = new URLSearchParams(window.location.search).get('env');
  if (isEnvironment(fromUrl)) return fromUrl;

  const stored = window.localStorage.getItem(ENVIRONMENT_STORAGE_KEY);
  if (isEnvironment(stored)) return stored;

  return 'local';
}

export function EnvironmentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [env, setEnvState] = useState<Environment>(initialEnvironment);

  const setEnv = useCallback((next: Environment) => {
    setEnvState(next);
    window.localStorage.setItem(ENVIRONMENT_STORAGE_KEY, next);

    // Keep ?env= in sync so a copied URL opens the same environment.
    const url = new URL(window.location.href);
    url.searchParams.set('env', next);
    window.history.replaceState(null, '', url);
  }, []);

  const value = useMemo(
    () => ({
      env,
      setEnv,
      isProduction: PRODUCTION_ENVIRONMENTS.includes(env),
    }),
    [env, setEnv]
  );

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
}
