import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setOrgRateLimit, removeOrgRateLimit } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import type { Environment } from '@/lib/environment';
import type { RateLimit } from '@/types';

export function useSetOrgRateLimit(env: Environment, orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      requests_per_second: number;
      rule: string;
      rule_variant?: string;
      remediation: string;
      bucket_type: string;
      notes: string;
    }) => setOrgRateLimit(orgId, env, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({ title: 'Rate limit set', description: orgId });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useRemoveOrgRateLimit(env: Environment, orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rl: RateLimit) =>
      removeOrgRateLimit(orgId, env, {
        rule: rl.rule,
        rule_variant: rl.rule_variant,
        bucket_type: rl.bucket_type,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({ title: 'Rate limit removed' });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
