import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmailVerification, updateEmailVerification } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import type { Environment } from '@/lib/environment';
import type { GetEmailVerificationResponse } from '@/types';

export function useEmailVerificationQuery(env: Environment, email: string) {
  return useQuery<GetEmailVerificationResponse>({
    queryKey: ['email-verification', env, email],
    queryFn: () => getEmailVerification(email, env),
    enabled: !!email,
  });
}

export function useUpdateEmailVerification(env: Environment, email: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ valid }: { valid: boolean }) =>
      updateEmailVerification(env, email, valid),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['email-verification', env, email],
      });
      toast({
        title: 'Verification updated',
        description: `${data.email_address} → ${data.valid ? 'valid' : 'invalid'}`,
      });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
