import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSesDomain, refreshSesDomain, createSesDomain } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import type { Environment } from '@/lib/environment';
import type { SesDomainResponse } from '@/types';

export function useSesDomainQuery(env: Environment, domain: string) {
  return useQuery<SesDomainResponse>({
    queryKey: ['ses-domain', env, domain],
    queryFn: () => getSesDomain(domain, env),
    enabled: !!domain,
  });
}

export function useRefreshSesDomain(env: Environment, domain: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => refreshSesDomain(domain, env),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ses-domain', env, domain] });
      toast({ title: 'SES domain refreshed', description: domain });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useCreateSesDomain(
  env: Environment,
  onSuccess?: (identityName: string) => void
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (domainName: string) =>
      createSesDomain(env, { domain: domainName }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ses-domain', env] });
      toast({ title: 'SES domain created', description: data.identity_name });
      onSuccess?.(data.identity_name);
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
