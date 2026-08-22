import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setFlag } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import type { Environment } from '@/lib/environment';

export function useSetFlag(env: Environment, flagName: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      enabled,
      rollout,
    }: {
      enabled: boolean;
      rollout: number;
    }) => setFlag(flagName, env, enabled, rollout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags', env] });
      queryClient.invalidateQueries({ queryKey: ['flag', env, flagName] });
      toast({ title: 'Saved', description: 'Feature flag updated.' });
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });
}
