import { useQuery } from '@tanstack/react-query';
import { getPendingMigrations } from '@/lib/api';
import type { Environment } from '@/lib/environment';

export function usePendingMigrations(
  env: Environment,
  migrationIds: string[] = []
) {
  return useQuery({
    queryKey: ['pending-migrations', env, migrationIds],
    queryFn: () => getPendingMigrations(env, migrationIds),
  });
}
