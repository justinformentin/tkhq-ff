import { useQuery } from '@tanstack/react-query';
import { checkMigration } from '@/lib/api';
import type { Environment } from '@/lib/environment';

export function useCheckMigration(env: Environment, migrationId: string) {
  return useQuery({
    queryKey: ['check-migration', env, migrationId],
    queryFn: () => checkMigration(migrationId, env),
    enabled: !!migrationId,
  });
}
