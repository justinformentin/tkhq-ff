import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFlagProduct, removeFlagProduct } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import type { Environment } from '@/lib/environment';

export function useFlagProductMutations(env: Environment, flagName: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: ({
      productType,
      productSubType,
      enabled,
    }: {
      productType: string;
      productSubType: string;
      enabled: boolean;
    }) => addFlagProduct(flagName, env, productType, productSubType, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flag', env, flagName] });
      toast({ title: 'Product rule added' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ type, subType }: { type: string; subType: string }) =>
      removeFlagProduct(flagName, env, type, subType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flag', env, flagName] });
      toast({ title: 'Product rule removed' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  return { addMutation, removeMutation };
}
