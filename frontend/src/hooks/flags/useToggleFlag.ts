import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setFlag } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import type { Environment } from '@/lib/environment';

export function useToggleFlag(env: Environment) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      flag,
      enabled,
      rollout_percent,
    }: {
      flag: string;
      enabled: boolean;
      rollout_percent: number;
    }) => setFlag(flag, env, enabled, rollout_percent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags', env] });
      toast({ title: 'Flag updated' });
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
