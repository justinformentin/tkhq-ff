import { useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluateOrgQuota, setOrgQuota, removeOrgQuota } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import type { Environment } from '@/lib/environment';
import type { QuotaOverride } from '@/types';

export function useEvaluateOrgQuota(env: Environment, orgId: string) {
  return useMutation({
    mutationFn: (label: string) => evaluateOrgQuota(orgId, env, label),
    onSuccess: (_data, label) =>
      toast({
        title: 'Quota evaluated (dry-run)',
        description: `label: ${label}`,
      }),
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useSetOrgQuota(env: Environment, orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ label, count }: { label: string; count: number }) =>
      setOrgQuota(orgId, env, label, count),
    onSuccess: (_data, { label, count }) => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({
        title: 'Quota override set',
        description: `${label} = ${count}`,
      });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useRemoveOrgQuota(env: Environment, orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (q: QuotaOverride) => removeOrgQuota(orgId, env, q.label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({ title: 'Quota override removed' });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
