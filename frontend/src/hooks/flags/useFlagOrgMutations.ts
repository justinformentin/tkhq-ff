import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFlagOrg, removeFlagOrg } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import type { Environment } from '@/lib/environment';

export function useFlagOrgMutations(env: Environment, flagName: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: ({ orgId, enabled }: { orgId: string; enabled: boolean }) =>
      addFlagOrg(flagName, env, orgId, enabled),
    onSuccess: (_data, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['flag', env, flagName] });
      toast({
        title: 'Org added',
        description: `Org ${enabled ? 'allowed' : 'denied'} successfully.`,
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (orgId: string) => removeFlagOrg(flagName, env, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flag', env, flagName] });
      toast({ title: 'Org removed' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  return { addMutation, removeMutation };
}
