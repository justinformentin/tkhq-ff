/**
 * CheckMigrationPanel — Look up a specific migration by ID.
 */

import { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { AppliedBadge } from './AppliedBadge';
import { useCheckMigration } from '@/hooks/migrations/useCheckMigration';
import { useEnvironment } from '@/lib/environment';

const FIELD_MONO =
  'w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm font-mono text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const PRIMARY_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40';

export function CheckMigrationPanel() {
  const { env } = useEnvironment();
  const [idInput, setIdInput] = useState('');
  const [checkedId, setCheckedId] = useState('');

  const { data, isLoading, error } = useCheckMigration(env, checkedId);

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
          onKeyDown={(e) => { if (e.key === 'Enter') handleCheck(); }}
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
          <span className="font-mono text-sm text-foreground">{data.migration_id}</span>
          <AppliedBadge applied={data.applied} />
        </div>
      ) : null}
    </Card>
  );
}
