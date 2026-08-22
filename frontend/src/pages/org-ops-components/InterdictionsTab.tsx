/**
 * InterdictionsTab — View active interdictions, set/remove interdictor block.
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { WriteWarning } from '@/components/ui/write-warning';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ToggleGroup } from '@/components/ui/toggle-group';
import { useSetOrgInterdiction } from '@/hooks/org-ops/useOrgInterdiction';
import type { Interdiction } from '@/types';
import type { Environment } from '@/lib/environment';

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
          <Field label="Scope" htmlFor="int-scope">
            <Input
              id="int-scope"
              value={intScope}
              onChange={(e) => setIntScope(e.target.value)}
              placeholder="e.g. org"
            />
          </Field>
          <Field label="Op" htmlFor="int-op">
            <Input
              id="int-op"
              value={intOp}
              onChange={(e) => setIntOp(e.target.value)}
              placeholder="e.g. all"
            />
          </Field>
          <Field label="Sub-Org ID (optional)" htmlFor="int-sub-org-id">
            <Input
              id="int-sub-org-id"
              mono
              value={intSubOrgId}
              onChange={(e) => setIntSubOrgId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </Field>
          <Field label="Action" className="flex flex-col justify-end">
            <ToggleGroup
              value={intBlocked}
              onChange={setIntBlocked}
              options={[
                { value: true, label: 'Block' },
                { value: false, label: 'Unblock' },
              ]}
            />
          </Field>
        </div>
        <Button
          variant={intBlocked ? 'danger' : 'primary'}
          onClick={() =>
            setIntMut.mutate({
              scope: intScope,
              op: intOp,
              blocked: intBlocked,
              suborg_id: intSubOrgId || undefined,
            })
          }
          disabled={setIntMut.isPending}
          className="mt-4"
        >
          {setIntMut.isPending
            ? 'Applying…'
            : intBlocked
              ? 'Set Block'
              : 'Remove Block'}
        </Button>
      </Card>
    </div>
  );
}
