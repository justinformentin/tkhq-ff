import { useQuery } from '@tanstack/react-query';
import { listSuppressedEmails } from '@/lib/api';
import type { Environment } from '@/lib/environment';

const PAGE_SIZE = 25;

export function useSuppressionList(env: Environment, currentToken?: string) {
  return useQuery({
    queryKey: ['suppression-list', env, currentToken],
    queryFn: () =>
      listSuppressedEmails(env, {
        page_size: PAGE_SIZE,
        next_token: currentToken,
      }),
  });
}
