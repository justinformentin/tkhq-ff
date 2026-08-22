import { useState } from 'react';
import { formatFlagName } from '@/lib/utils';
import { OrgTab } from './OrgTab';
import { ProductTab } from './ProductTab';
import { Switch } from './Switch';
import * as Tabs from '@radix-ui/react-tabs';
import { useEnvironment } from '@/lib/environment';
import { useFlagDetail } from '@/hooks/flags/useFlagDetail';
import { useSetFlag } from '@/hooks/flags/useSetFlag';

interface FlagDetailProps {
  flagName: string;
}

const TAB_TRIGGER =
  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:text-foreground';

export function FlagDetail({ flagName }: FlagDetailProps) {
  const { env } = useEnvironment();
  const { data: flagData, isLoading, error } = useFlagDetail(env, flagName);
  const saveMutation = useSetFlag(env, flagName);

  const [localEnabled, setLocalEnabled] = useState<boolean | null>(null);
  const [localRollout, setLocalRollout] = useState<number | null>(null);

  const enabled = localEnabled ?? flagData?.enabled ?? false;
  const rollout = localRollout ?? flagData?.rollout_percent ?? 0;
  const isDirty =
    (localEnabled !== null && localEnabled !== flagData?.enabled) ||
    (localRollout !== null && localRollout !== flagData?.rollout_percent);

  if (error) {
    return (
      <div className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
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
          <div className="h-8 rounded w-64 bg-elevated-background" />
          <div className="h-4 rounded w-48 bg-elevated-background" />
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {formatFlagName(flagName)}
          </h1>
          <p className="text-sm font-mono mt-1 text-muted-foreground">
            {flagName}
          </p>
        </div>
      )}

      {/* Global settings card */}
      <div className="rounded-lg border border-border bg-card-background p-6 space-y-6">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Global Settings
        </h2>

        {/* Enabled toggle */}
        <div className="flex items-center gap-4">
          <label
            htmlFor="enabled-toggle"
            className="text-sm font-medium text-foreground"
          >
            Enabled
          </label>
          {isLoading ? (
            <div className="h-5 w-9 rounded-full animate-pulse bg-elevated-background" />
          ) : (
            <Switch
              id="enabled-toggle"
              checked={enabled}
              onCheckedChange={setLocalEnabled}
            />
          )}
          <span className="text-xs text-muted-foreground">
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
              className="text-sm font-medium text-foreground"
            >
              Rollout Percentage
            </label>
            <span className="text-sm font-mono font-bold text-primary">
              {rollout}%
            </span>
          </div>
          {isLoading ? (
            <div className="h-2 rounded-full w-full animate-pulse bg-elevated-background" />
          ) : (
            <input
              id="rollout-slider"
              type="range"
              min={0}
              max={100}
              value={rollout}
              onChange={(e) => setLocalRollout(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
          )}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={() => saveMutation.mutate({ enabled, rollout })}
          disabled={!isDirty || saveMutation.isPending || isLoading}
          className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      {isLoading ? (
        <div className="h-48 rounded-lg animate-pulse bg-card-background" />
      ) : flagData ? (
        <Tabs.Root defaultValue="orgs">
          <Tabs.List className="flex gap-1 border-b border-border">
            {[
              { value: 'orgs', label: `Orgs (${orgCount})` },
              { value: 'products', label: `Products (${productCount})` },
            ].map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className={TAB_TRIGGER}
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
