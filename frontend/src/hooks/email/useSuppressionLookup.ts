import { useQuery } from '@tanstack/react-query';
import { getSuppressedEmail } from '@/lib/api';
import type { Environment } from '@/lib/environment';
import type { GetSuppressedEmailResponse } from '@/types';

export function useSuppressionLookup(env: Environment, emailAddress: string) {
  return useQuery<GetSuppressedEmailResponse>({
    queryKey: ['suppression-lookup', env, emailAddress],
    queryFn: () => getSuppressedEmail(emailAddress, env),
    enabled: !!emailAddress,
  });
}
