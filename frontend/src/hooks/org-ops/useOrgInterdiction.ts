import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setOrgInterdictorBlock } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import type { Environment } from '@/lib/environment';

export function useSetOrgInterdiction(env: Environment, orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      scope: string;
      op: string;
      blocked: boolean;
      suborg_id?: string;
    }) => setOrgInterdictorBlock(orgId, env, body),
    onSuccess: (data, { blocked }) => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({
        title: blocked ? 'Block set' : 'Block removed',
        description: `Key: ${data.raw_key}`,
      });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
