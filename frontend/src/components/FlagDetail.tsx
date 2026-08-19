import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFlag, setFlag } from '../lib/api';
import { formatFlagName } from '../lib/utils';
import { OrgTab } from './OrgTab';
import { ProductTab } from './ProductTab';
import { Switch } from './Switch';
import { useToast } from '../hooks/useToast';
import * as Tabs from '@radix-ui/react-tabs';

interface FlagDetailProps {
  flagName: string;
}

export function FlagDetail({ flagName }: FlagDetailProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: flagData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['flag', flagName],
    queryFn: () => getFlag(flagName),
  });

  const [localEnabled, setLocalEnabled] = useState<boolean | null>(null);
  const [localRollout, setLocalRollout] = useState<number | null>(null);

  const enabled = localEnabled ?? flagData?.enabled ?? false;
  const rollout = localRollout ?? flagData?.rollout_percent ?? 0;

  const isDirty =
    (localEnabled !== null && localEnabled !== flagData?.enabled) ||
    (localRollout !== null && localRollout !== flagData?.rollout_percent);

  const saveMutation = useMutation({
    mutationFn: () => setFlag(flagName, enabled, rollout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags'] });
      queryClient.invalidateQueries({ queryKey: ['flag', flagName] });
      setLocalEnabled(null);
      setLocalRollout(null);
      toast({ title: 'Saved', description: 'Feature flag updated.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  if (error) {
    return (
      <div
        className="rounded-lg border px-4 py-3 text-sm"
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          color: 'var(--color-danger)',
        }}
      >
        Failed to load flag: {(error as Error).message}
      </div>
    );
  }

  const orgCount =
    (flagData?.allowed_orgs?.length || 0) +
    (flagData?.disallowed_orgs?.length || 0);
  const productCount =
    (flagData?.allowed_products?.length || 0) +
    (flagData?.disallowed_products?.length || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-8 rounded w-64" style={{ backgroundColor: 'var(--color-surface-2)' }} />
          <div className="h-4 rounded w-48" style={{ backgroundColor: 'var(--color-surface-2)' }} />
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {formatFlagName(flagName)}
          </h1>
          <p className="text-sm font-mono mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {flagName}
          </p>
        </div>
      )}

      {/* Global settings card */}
      <div
        className="rounded-lg border p-6 space-y-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Global Settings
        </h2>

        {/* Enabled toggle */}
        <div className="flex items-center gap-4">
          <label
            htmlFor="enabled-toggle"
            className="text-sm font-medium"
            style={{ color: 'var(--color-text)' }}
          >
            Enabled
          </label>
          {isLoading ? (
            <div className="h-5 w-9 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-surface-2)' }} />
          ) : (
            <Switch
              id="enabled-toggle"
              checked={enabled}
              onCheckedChange={setLocalEnabled}
            />
          )}
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {enabled
              ? 'Globally enabled'
              : 'Globally disabled — overrides all org/product rules'}
          </span>
        </div>

        {/* Rollout slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="rollout-slider"
              className="text-sm font-medium"
              style={{ color: 'var(--color-text)' }}
            >
              Rollout Percentage
            </label>
            <span
              className="text-sm font-mono font-bold"
              style={{ color: 'var(--color-primary)' }}
            >
              {rollout}%
            </span>
          </div>
          {isLoading ? (
            <div className="h-2 rounded-full w-full animate-pulse" style={{ backgroundColor: 'var(--color-surface-2)' }} />
          ) : (
            <input
              id="rollout-slider"
              type="range"
              min={0}
              max={100}
              value={rollout}
              onChange={(e) => setLocalRollout(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor: 'var(--color-primary)' }}
            />
          )}
          <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!isDirty || saveMutation.isPending || isLoading}
          className="px-4 py-2 rounded-md text-sm font-medium transition-opacity disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      {isLoading ? (
        <div className="h-48 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--color-surface)' }} />
      ) : flagData ? (
        <Tabs.Root defaultValue="orgs">
          <Tabs.List
            className="flex gap-1 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {[
              { value: 'orgs', label: `Orgs (${orgCount})` },
              { value: 'products', label: `Products (${productCount})` },
            ].map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors data-[state=active]:border-indigo-500 data-[state=inactive]:border-transparent"
                style={{
                  color: 'var(--color-text-muted)',
                }}
                onMouseEnter={(e) => {
                  if (e.currentTarget.getAttribute('data-state') !== 'active') {
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-text)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (e.currentTarget.getAttribute('data-state') !== 'active') {
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
                  }
                }}
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="orgs" className="mt-4">
            <OrgTab
              flagName={flagName}
              allowedOrgs={flagData.allowed_orgs || []}
              disallowedOrgs={flagData.disallowed_orgs || []}
            />
          </Tabs.Content>
          <Tabs.Content value="products" className="mt-4">
            <ProductTab
              flagName={flagName}
              allowedProducts={flagData.allowed_products || []}
              disallowedProducts={flagData.disallowed_products || []}
            />
          </Tabs.Content>
        </Tabs.Root>
      ) : null}
    </div>
  );
}
