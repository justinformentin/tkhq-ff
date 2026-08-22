/**
 * Migration service — wraps OperatorAgentService RPCs for migration status.
 *
 * RBAC note: CheckMigration and GetPendingMigrations require the
 * `migration:read` permission, which is restricted to engineering roles.
 * The backend gateway and K8s RBAC enforce this — the UI does not need to
 * implement its own RBAC check.
 *
 * Both calls mirror the flag/orgOps pattern: no enum remapping, no silent
 * env fallbacks, no reinvented auth plumbing.
 */

import { agentCall } from '../grpc/client';
import { Environment } from '../config/environments';
import {
  CheckMigrationRequest,
  CheckMigrationResponse,
  GetPendingMigrationsRequest,
  GetPendingMigrationsResponse,
} from '../grpc/types';

// ---------------------------------------------------------------------------
// CheckMigration (R) — check whether a specific migration has been applied
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// GetPendingMigrations (R) — list pending migrations
//
// Passing an empty `migration_ids` array asks the upstream RPC for all
// pending migrations; callers may pass a non-empty list to scope the check.
// ---------------------------------------------------------------------------

export async function getPendingMigrations(
  env: Environment,
  migrationIds: string[] = [],
  idToken: string
): Promise<GetPendingMigrationsResponse> {
  return agentCall<GetPendingMigrationsRequest, GetPendingMigrationsResponse>(
    env,
    'GetPendingMigrations',
    { migration_ids: migrationIds },
    idToken
  );
}
