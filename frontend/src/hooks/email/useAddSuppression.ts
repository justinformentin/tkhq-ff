import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addSuppressedEmail } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import type { Environment } from '@/lib/environment';
import type { SuppressionListReason } from '@/types';

interface UseAddSuppressionOptions {
  env: Environment;
  onSuccess?: () => void;
}

export function useAddSuppression({ env, onSuccess }: UseAddSuppressionOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      email,
      reason,
    }: {
      email: string;
      reason: SuppressionListReason;
    }) => addSuppressedEmail(env, email, reason),
    onSuccess: (_data, { email }) => {
      queryClient.invalidateQueries({ queryKey: ['suppression-list', env] });
      toast({ title: 'Email suppressed', description: email });
      onSuccess?.();
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
