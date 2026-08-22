import { useQuery } from '@tanstack/react-query';
import { getDefaultRateLimits } from '@/lib/api';
import type { Environment } from '@/lib/environment';

export function useDefaultRateLimits(env: Environment) {
  return useQuery({
    queryKey: ['rate-limit-defaults', env],
    queryFn: () => getDefaultRateLimits(env),
  });
}
