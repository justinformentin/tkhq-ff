/**
 * SesDomainTab — SES domain lookup, refresh, and create sub-panels.
 */

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { WriteWarning } from '@/components/ui/write-warning';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SesDomainPanel } from './SesDomainPanel';
import {
  useSesDomainQuery,
  useRefreshSesDomain,
  useCreateSesDomain,
} from '@/hooks/email/useSesDomain';
import type { Environment } from '@/lib/environment';

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
          <Input
            mono
            value={sesDomainInput}
            onChange={(e) => setSesDomainInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && sesDomainInput.trim())
                setSesDomain(sesDomainInput.trim());
            }}
            placeholder="example.com"
            className="flex-1"
          />
          <Button
            onClick={() => { if (sesDomainInput.trim()) setSesDomain(sesDomainInput.trim()); }}
          >
            <Search size={14} />
            Load Domain
          </Button>
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
          <Button onClick={() => setShowCreateSes(true)}>
            <Plus size={14} />
            Create SES Domain…
          </Button>
        ) : (
          <div className="space-y-4">
            <Field label="Domain" htmlFor="create-ses-domain">
              <Input
                id="create-ses-domain"
                mono
                value={createSesDomainInput}
                onChange={(e) => setCreateSesDomainInput(e.target.value)}
                placeholder="example.com"
              />
            </Field>
            <div className="flex gap-3">
              <Button
                onClick={() => createSesMut.mutate(createSesDomainInput.trim())}
                disabled={createSesMut.isPending || !createSesDomainInput.trim()}
              >
                <Plus size={14} />
                {createSesMut.isPending ? 'Creating…' : 'Confirm Create'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => { setShowCreateSes(false); setCreateSesDomainInput(''); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
