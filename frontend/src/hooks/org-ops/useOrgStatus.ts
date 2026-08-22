import { useQuery } from '@tanstack/react-query';
import { getOrgStatus } from '@/lib/api';
import type { Environment } from '@/lib/environment';
import type { OrgStatusResponse } from '@/types';

export function useOrgStatus(env: Environment, orgId: string) {
  return useQuery<OrgStatusResponse>({
    queryKey: ['org-status', env, orgId],
    queryFn: () => getOrgStatus(orgId, env),
    enabled: !!orgId,
  });
}
