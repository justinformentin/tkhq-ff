/**
 * PendingMigrationsPanel — Filterable list of pending migrations.
 */

import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { AppliedBadge } from './AppliedBadge';
import { usePendingMigrations } from '@/hooks/migrations/usePendingMigrations';
import { useEnvironment } from '@/lib/environment';

const FIELD_MONO =
  'w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm font-mono text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const PRIMARY_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40';

export function PendingMigrationsPanel() {
  const { env } = useEnvironment();
  const [idsInput, setIdsInput] = useState('');
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);

  const { data, isLoading, error, refetch, isFetching } = usePendingMigrations(
    env,
    submittedIds
  );

  const results = data?.results ?? [];
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
        {results.length > 0 &&
          ` (${pending.length} pending / ${results.length} total)`}
      </SectionTitle>

      <p className="text-sm mb-4 text-muted-foreground">
        Lists migrations that have not yet been applied. Optionally filter by
        specific migration IDs (comma-separated). Leave blank to fetch all.
      </p>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="migration-id-1, migration-id-2, … (optional)"
          value={idsInput}
          onChange={(e) => setIdsInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleFilter(); }}
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
                <td className="py-2 font-mono text-foreground">{r.migration_id}</td>
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
