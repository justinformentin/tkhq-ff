/**
 * InterdictionsTab — View active interdictions, set/remove interdictor block.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { WriteWarning } from '@/components/ui/write-warning';
import { useSetOrgInterdiction } from '@/hooks/org-ops/useOrgInterdiction';
import type { Interdiction } from '@/types';
import type { Environment } from '@/lib/environment';

const FIELD =
  'w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const FIELD_MONO = `${FIELD} font-mono`;
const FIELD_LABEL = 'text-xs mb-1 block text-muted-foreground';

interface InterdictionsTabProps {
  env: Environment;
  orgId: string;
  interdictions: Interdiction[];
  isProduction: boolean;
}

export function InterdictionsTab({
  env,
  orgId,
  interdictions,
  isProduction,
}: InterdictionsTabProps) {
  const [intScope, setIntScope] = useState('org');
  const [intOp, setIntOp] = useState('all');
  const [intBlocked, setIntBlocked] = useState(true);
  const [intSubOrgId, setIntSubOrgId] = useState('');

  const setIntMut = useSetOrgInterdiction(env, orgId);

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle>Active Interdictions</SectionTitle>
        {interdictions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No interdictions for this org.</p>
        ) : (
          <div className="space-y-2">
            {interdictions.map((int) => (
              <div
                key={int.key}
                className="rounded-lg border border-border bg-card-background px-4 py-3 text-sm"
              >
                <p className="font-mono font-medium text-foreground">{int.key}</p>
                {int.owners.length > 0 && (
                  <p className="text-xs mt-1 text-muted-foreground">
                    Owners: {int.owners.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Set / Remove Interdictor Block</SectionTitle>
        {isProduction && <WriteWarning env={env} />}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={FIELD_LABEL}>Scope</label>
            <input
              type="text"
              value={intScope}
              onChange={(e) => setIntScope(e.target.value)}
              placeholder="e.g. org"
              className={FIELD}
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>Op</label>
            <input
              type="text"
              value={intOp}
              onChange={(e) => setIntOp(e.target.value)}
              placeholder="e.g. all"
              className={FIELD}
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>Sub-Org ID (optional)</label>
            <input
              type="text"
              value={intSubOrgId}
              onChange={(e) => setIntSubOrgId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className={FIELD_MONO}
            />
          </div>
          <div className="flex flex-col justify-end">
            <label className={FIELD_LABEL}>Action</label>
            <div className="flex gap-2">
              <button
                onClick={() => setIntBlocked(true)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                  intBlocked
                    ? 'border-primary-border bg-primary-soft text-primary'
                    : 'border-transparent text-muted-foreground'
                )}
              >
                Block
              </button>
              <button
                onClick={() => setIntBlocked(false)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                  !intBlocked
                    ? 'border-primary-border bg-primary-soft text-primary'
                    : 'border-transparent text-muted-foreground'
                )}
              >
                Unblock
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={() =>
            setIntMut.mutate({
              scope: intScope,
              op: intOp,
              blocked: intBlocked,
              suborg_id: intSubOrgId || undefined,
            })
          }
          disabled={setIntMut.isPending}
          className={cn(
            'mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground transition-colors disabled:opacity-40',
            intBlocked ? 'bg-danger hover:opacity-90' : 'bg-primary hover:bg-primary-hover'
          )}
        >
          {setIntMut.isPending
            ? 'Applying…'
            : intBlocked
              ? 'Set Block'
              : 'Remove Block'}
        </button>
      </Card>
    </div>
  );
}
