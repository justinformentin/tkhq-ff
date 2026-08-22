/**
 * Migrations status page — engineering-only (migration:read group).
 *
 * RBAC is enforced by OperatorAgentService via the forwarded X-ID-Token.
 * No permission gating is needed in this UI.
 */
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPendingMigrations } from '@/lib/api';
import { useEnvironment } from '@/lib/environment';
import { RefreshCw, CheckCircle, Clock } from 'lucide-react';
import type { MigrationResult } from '@/types';

export const Route = createFileRoute('/migrations/')({
  component: MigrationsIndexRouteComponent,
});

const HEADER_CELL =
  'text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground';

function MigrationStatusBadge({ applied }: { applied: boolean }) {
  if (applied) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-success-soft text-success">
        <CheckCircle size={11} />
        Applied
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-warning-soft text-warning">
      <Clock size={11} />
      Pending
    </span>
  );
}

function MigrationsIndexRouteComponent() {
  const { env } = useEnvironment();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['migrations-pending', env],
    queryFn: () => getPendingMigrations(env),
  });

  const results: MigrationResult[] = data?.results ?? [];

  const appliedCount = results.filter((r) => r.applied).length;
  const pendingCount = results.filter((r) => !r.applied).length;

  function toggleRow(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="p-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Migrations
          </h1>
          <p className="text-sm mt-0.5 text-muted-foreground">
            Read-only migration status from OperatorAgentService — engineering
            only.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && (
            <div className="flex gap-2 text-xs text-muted-foreground">
              {appliedCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 bg-success-soft text-success font-medium">
                  <CheckCircle size={10} />
                  {appliedCount} applied
                </span>
              )}
              {pendingCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 bg-warning-soft text-warning font-medium">
                  <Clock size={10} />
                  {pendingCount} pending
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-card-background text-foreground transition-colors hover:bg-card-background-hover disabled:opacity-50"
          >
            <RefreshCw
              size={13}
              className={isFetching ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          Failed to load migrations:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-card-background">
              <th className={HEADER_CELL}>Migration ID</th>
              <th className={HEADER_CELL}>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-border animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-4 rounded w-64 bg-elevated-background" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 rounded w-20 bg-elevated-background" />
                    </td>
                  </tr>
                ))
              : results.map((migration) => (
                  <>
                    <tr
                      key={migration.migration_id}
                      className="border-t border-border cursor-pointer transition-colors hover:bg-card-background-hover"
                      onClick={() => toggleRow(migration.migration_id)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-foreground">
                          {migration.migration_id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <MigrationStatusBadge applied={migration.applied} />
                      </td>
                    </tr>

                    {/* Inline detail expand */}
                    {expandedId === migration.migration_id && (
                      <tr
                        key={`${migration.migration_id}-detail`}
                        className="border-t border-border bg-elevated-background"
                      >
                        <td colSpan={2} className="px-6 py-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex gap-4">
                              <span className="text-muted-foreground w-24 shrink-0">
                                Migration ID
                              </span>
                              <span className="font-mono text-foreground break-all">
                                {migration.migration_id}
                              </span>
                            </div>
                            <div className="flex gap-4">
                              <span className="text-muted-foreground w-24 shrink-0">
                                Applied
                              </span>
                              <span className="text-foreground">
                                {migration.applied ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
          </tbody>
        </table>

        {!isLoading && results.length === 0 && !error && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No migrations found
          </div>
        )}
      </div>
    </div>
  );
}
