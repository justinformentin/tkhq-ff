/**
 * MigrationsPage — Migration Status admin panel.
 *
 * Provides two read-only views backed by OperatorAgentService RPCs:
 *   - Pending Migrations (GetPendingMigrations) — table of unapplied migrations
 *   - Check Migration  (CheckMigration)          — look up a specific migration ID
 *
 * RBAC note: both RPCs require `migration:read`, which is restricted to
 * engineering roles. Enforcement is handled by the backend gateway and K8s
 * RBAC — this UI does not implement its own RBAC check.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useEnvironment } from '@/lib/environment';
import { cn } from '@/lib/utils';
import { getPendingMigrations, checkMigration } from '@/lib/api';
import type { CheckMigrationResponse } from '@/types';

// ---------------------------------------------------------------------------
// Shared control styling (mirrors OrgOpsPage conventions)
// ---------------------------------------------------------------------------

const FIELD =
  'w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const FIELD_MONO = `${FIELD} font-mono`;

const PRIMARY_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40';

// ---------------------------------------------------------------------------
// Small shared helpers
// ---------------------------------------------------------------------------

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card-background p-5',
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-semibold text-sm uppercase tracking-wider mb-4 text-muted-foreground">
      {children}
    </h2>
  );
}

function AppliedBadge({ applied }: { applied: boolean }) {
  return applied ? (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-success-soft text-success">
      <CheckCircle2 size={12} />
      Applied
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-warning-soft text-warning">
      <XCircle size={12} />
      Pending
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pending Migrations sub-panel
// ---------------------------------------------------------------------------

function PendingMigrationsPanel() {
  const { env } = useEnvironment();
  const [idsInput, setIdsInput] = useState('');
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['pending-migrations', env, submittedIds],
    queryFn: () => getPendingMigrations(env, submittedIds),
  });

  const results: CheckMigrationResponse[] = data?.results ?? [];
  const pending = results.filter((r) => !r.applied);

  function handleFilter() {
    const ids = idsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setSubmittedIds(ids);
  }

  return (
    <Card>
      <SectionTitle>
        Pending Migrations
        {results.length > 0 && ` (${pending.length} pending / ${results.length} total)`}
      </SectionTitle>

      <p className="text-sm mb-4 text-muted-foreground">
        Lists migrations that have not yet been applied. Optionally filter by
        specific migration IDs (comma-separated). Leave blank to fetch all.
      </p>

      {/* Optional filter */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="migration-id-1, migration-id-2, … (optional)"
          value={idsInput}
          onChange={(e) => setIdsInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleFilter();
          }}
          className={cn(FIELD_MONO, 'flex-1')}
        />
        <button onClick={handleFilter} className={PRIMARY_BUTTON}>
          <Search size={14} />
          Filter
        </button>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground transition-colors hover:bg-hover-overlay hover:text-foreground disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* States */}
      {isLoading ? (
        <div className="py-8 text-center text-sm animate-pulse text-muted-foreground">
          Loading migrations…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {(error as Error).message}
        </div>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No migrations found.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="text-left pb-2">Migration ID</th>
              <th className="text-right pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {results.map((r) => (
              <tr key={r.migration_id}>
                <td className="py-2 font-mono text-foreground">
                  {r.migration_id}
                </td>
                <td className="py-2 text-right">
                  <AppliedBadge applied={r.applied} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Check Migration sub-panel
// ---------------------------------------------------------------------------

function CheckMigrationPanel() {
  const { env } = useEnvironment();
  const [idInput, setIdInput] = useState('');
  const [checkedId, setCheckedId] = useState('');

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['check-migration', env, checkedId],
    queryFn: () => checkMigration(checkedId, env),
    enabled: !!checkedId,
  });

  function handleCheck() {
    if (idInput.trim()) setCheckedId(idInput.trim());
  }

  return (
    <Card>
      <SectionTitle>Check Migration Status</SectionTitle>
      <p className="text-sm mb-4 text-muted-foreground">
        Look up whether a specific migration has been applied.
      </p>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="migration-id"
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCheck();
          }}
          className={cn(FIELD_MONO, 'flex-1')}
        />
        <button
          onClick={handleCheck}
          disabled={!idInput.trim()}
          className={PRIMARY_BUTTON}
        >
          <Search size={14} />
          Check
        </button>
      </div>

      {/* States */}
      {checkedId && isLoading ? (
        <div className="py-4 text-center text-sm animate-pulse text-muted-foreground">
          Checking…
        </div>
      ) : checkedId && error ? (
        <div className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {(error as Error).message}
        </div>
      ) : data ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card-background px-4 py-3">
          <span className="font-mono text-sm text-foreground">
            {data.migration_id}
          </span>
          <AppliedBadge applied={data.applied} />
        </div>
      ) : null}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

export function MigrationsPage() {
  return (
    <div className="p-8 max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Migration Status
        </h1>
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
