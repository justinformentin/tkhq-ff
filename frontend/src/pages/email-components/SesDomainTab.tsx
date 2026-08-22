/**
 * SesDomainTab — SES domain lookup, refresh, and create sub-panels.
 */

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { WriteWarning } from '@/components/ui/write-warning';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SesDomainPanel } from './SesDomainPanel';
import {
  useSesDomainQuery,
  useRefreshSesDomain,
  useCreateSesDomain,
} from '@/hooks/email/useSesDomain';
import type { Environment } from '@/lib/environment';

const FIELD =
  'w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const FIELD_MONO = `${FIELD} font-mono`;
const FIELD_LABEL = 'text-xs mb-1 block text-muted-foreground';
const PRIMARY_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40';

interface SesDomainTabProps {
  env: Environment;
  isProduction: boolean;
}

export function SesDomainTab({ env, isProduction }: SesDomainTabProps) {
  const [sesDomain, setSesDomain] = useState('');
  const [sesDomainInput, setSesDomainInput] = useState('');
  const [showCreateSes, setShowCreateSes] = useState(false);
  const [createSesDomainInput, setCreateSesDomainInput] = useState('');
  const [confirmRefreshDomain, setConfirmRefreshDomain] = useState(false);

  const { data: sesData, isLoading: sesLoading, error: sesError } =
    useSesDomainQuery(env, sesDomain);

  const refreshSesMut = useRefreshSesDomain(env, sesDomain);

  const createSesMut = useCreateSesDomain(env, (identityName) => {
    setSesDomain(identityName);
    setSesDomainInput(identityName);
    setShowCreateSes(false);
    setCreateSesDomainInput('');
  });

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirmRefreshDomain}
        title="Refresh SES domain?"
        description={`This will delete and recreate the SES identity for "${sesDomain}", generating fresh DNS records. Existing verification will be reset.`}
        confirmLabel="Refresh"
        dangerous
        onConfirm={() => { setConfirmRefreshDomain(false); refreshSesMut.mutate(); }}
        onCancel={() => setConfirmRefreshDomain(false)}
      />

      <Card>
        <SectionTitle>SES Domain Lookup</SectionTitle>
        <div className="flex gap-3">
          <input
            type="text"
            value={sesDomainInput}
            onChange={(e) => setSesDomainInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && sesDomainInput.trim())
                setSesDomain(sesDomainInput.trim());
            }}
            placeholder="example.com"
            className={cn(FIELD_MONO, 'flex-1')}
          />
          <button
            onClick={() => { if (sesDomainInput.trim()) setSesDomain(sesDomainInput.trim()); }}
            className={PRIMARY_BUTTON}
          >
            <Search size={14} />
            Load Domain
          </button>
        </div>
        {sesDomain && sesLoading && (
          <p className="text-sm animate-pulse text-muted-foreground mt-4">Loading domain…</p>
        )}
        {sesDomain && sesError && (
          <p className="text-sm text-danger mt-4">{(sesError as Error).message}</p>
        )}
        {sesDomain && sesData && (
          <SesDomainPanel
            data={sesData}
            onRefresh={() => setConfirmRefreshDomain(true)}
            refreshPending={refreshSesMut.isPending}
            isProduction={isProduction}
          />
        )}
      </Card>

      <Card>
        <SectionTitle>Create SES Domain</SectionTitle>
        <p className="text-sm text-muted-foreground mb-4">
          Provisions SES resources (Email Identity, Configuration Set, Tenant) for a new domain.
          Confirmation required.
        </p>
        {isProduction && <WriteWarning env={env} />}
        {!showCreateSes ? (
          <button onClick={() => setShowCreateSes(true)} className={PRIMARY_BUTTON}>
            <Plus size={14} />
            Create SES Domain…
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={FIELD_LABEL}>Domain</label>
              <input
                type="text"
                value={createSesDomainInput}
                onChange={(e) => setCreateSesDomainInput(e.target.value)}
                placeholder="example.com"
                className={FIELD_MONO}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => createSesMut.mutate(createSesDomainInput.trim())}
                disabled={createSesMut.isPending || !createSesDomainInput.trim()}
                className={PRIMARY_BUTTON}
              >
                <Plus size={14} />
                {createSesMut.isPending ? 'Creating…' : 'Confirm Create'}
              </button>
              <button
                onClick={() => { setShowCreateSes(false); setCreateSesDomainInput(''); }}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-hover-overlay transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
