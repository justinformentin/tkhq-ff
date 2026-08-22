/**
 * Migration Operations service — wraps OperatorAgentService RPCs for checking
 * migration status.  Read-only; no writes are needed (engineering view only).
 *
 * Access is restricted to the migration:read group via the X-ID-Token that the
 * backend forwards to OperatorAgentService — no extra gating is needed here.
 */

import { agentCall } from '../grpc/client';
import { Environment } from '../config/environments';
import {
  CheckMigrationRequest,
  CheckMigrationResponse,
  GetPendingMigrationsRequest,
  GetPendingMigrationsResponse,
} from '../grpc/types';

/**
 * CheckMigration — checks whether a single migration has been applied.
 * Calls OperatorAgentService.CheckMigration with the given migration_id.
 */
export async function checkMigration(
  env: Environment,
  migrationId: string,
  idToken: string
): Promise<CheckMigrationResponse> {
  return agentCall<CheckMigrationRequest, CheckMigrationResponse>(
    env,
    'CheckMigration',
    { migration_id: migrationId },
    idToken
  );
}

/**
 * GetPendingMigrations — returns the list of migrations and their applied status.
 * Calls OperatorAgentService.GetPendingMigrations with an empty migration_ids
 * list, which causes the agent to return all known pending migrations.
 */
export async function getPendingMigrations(
  env: Environment,
  idToken: string
): Promise<GetPendingMigrationsResponse> {
  return agentCall<GetPendingMigrationsRequest, GetPendingMigrationsResponse>(
    env,
    'GetPendingMigrations',
    { migration_ids: [] },
    idToken
  );
}
