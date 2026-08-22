/**
 * MigrationsPage — Migration Status admin panel (thin orchestrator).
 *
 * RBAC note: both RPCs require `migration:read`, which is restricted to
 * engineering roles. Enforcement is handled by the backend gateway and K8s
 * RBAC — this UI does not implement its own RBAC check.
 */

import { PendingMigrationsPanel } from './migrations-components/PendingMigrationsPanel';
import { CheckMigrationPanel } from './migrations-components/CheckMigrationPanel';

export function MigrationsPage() {
  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Migration Status</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Read-only view of database migration status via OperatorAgentService.
          Requires <code className="font-mono text-xs">migration:read</code>{' '}
          (engineering-only — enforced by the backend gateway and K8s RBAC).
        </p>
      </div>

      <PendingMigrationsPanel />
      <CheckMigrationPanel />
    </div>
  );
}
