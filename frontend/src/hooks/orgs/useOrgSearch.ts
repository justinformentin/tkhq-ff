import { useQuery } from '@tanstack/react-query';
import { searchOrg } from '@/lib/api';
import type { Environment } from '@/lib/environment';

export function useOrgSearch(env: Environment, orgId: string) {
  return useQuery({
    queryKey: ['org-search', env, orgId],
    queryFn: () => searchOrg(orgId, env),
    enabled: !!orgId,
  });
}
