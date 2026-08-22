import { useQuery } from '@tanstack/react-query';
import { listFlags } from '@/lib/api';
import type { Environment } from '@/lib/environment';

export function useFlagList(env: Environment, withOrgs = false) {
  return useQuery({
    queryKey: ['flags', env],
    queryFn: () => listFlags(env, withOrgs),
  });
}
