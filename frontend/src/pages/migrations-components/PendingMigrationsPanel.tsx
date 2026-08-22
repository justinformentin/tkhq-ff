/**
 * PendingMigrationsPanel — Filterable list of pending migrations.
 */

import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppliedBadge } from './AppliedBadge';
import { usePendingMigrations } from '@/hooks/migrations/usePendingMigrations';
import { useEnvironment } from '@/lib/environment';

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
        <Input
          mono
          placeholder="migration-id-1, migration-id-2, … (optional)"
          value={idsInput}
          onChange={(e) => setIdsInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleFilter(); }}
          className="flex-1"
        />
        <Button onClick={handleFilter}>
          <Search size={14} />
          Filter
        </Button>
        <Button
          variant="secondary"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
        </Button>
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
