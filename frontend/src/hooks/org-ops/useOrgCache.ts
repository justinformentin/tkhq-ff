import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearOrgCache } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import type { Environment } from '@/lib/environment';

export function useClearOrgCache(env: Environment, orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (includeSubOrgs: boolean) =>
      clearOrgCache(orgId, env, includeSubOrgs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({ title: 'Cache cleared', description: orgId });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
