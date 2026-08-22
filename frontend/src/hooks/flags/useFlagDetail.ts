import { useQuery } from '@tanstack/react-query';
import { getFlag } from '@/lib/api';
import type { Environment } from '@/lib/environment';

export function useFlagDetail(env: Environment, flagName: string) {
  return useQuery({
    queryKey: ['flag', env, flagName],
    queryFn: () => getFlag(flagName, env),
  });
}
