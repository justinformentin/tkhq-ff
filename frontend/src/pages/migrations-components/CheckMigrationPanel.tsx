/**
 * CheckMigrationPanel — Look up a specific migration by ID.
 */

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppliedBadge } from './AppliedBadge';
import { useCheckMigration } from '@/hooks/migrations/useCheckMigration';
import { useEnvironment } from '@/lib/environment';

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
        <Input
          mono
          placeholder="migration-id"
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCheck(); }}
          className="flex-1"
        />
        <Button onClick={handleCheck} disabled={!idInput.trim()}>
          <Search size={14} />
          Check
        </Button>
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
