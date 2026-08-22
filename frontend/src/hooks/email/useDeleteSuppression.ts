import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSuppressedEmail } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import type { Environment } from '@/lib/environment';

interface UseDeleteSuppressionOptions {
  env: Environment;
  onSuccess?: (email: string) => void;
}

export function useDeleteSuppression({
  env,
  onSuccess,
}: UseDeleteSuppressionOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => deleteSuppressedEmail(email, env),
    onSuccess: (_data, email) => {
      queryClient.invalidateQueries({ queryKey: ['suppression-list', env] });
      toast({ title: 'Suppression removed', description: email });
      onSuccess?.(email);
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
