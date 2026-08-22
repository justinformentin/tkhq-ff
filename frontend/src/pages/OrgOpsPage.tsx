/**
 * OrgOpsPage — Org Operations admin panel (thin orchestrator).
 *
 * Delegates to tab sub-components in org-ops-components/:
 *   OrgStatusTab, RateLimitsTab, InterdictionsTab, QuotasTab, CacheTab
 */

import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Search } from 'lucide-react';
import { useEnvironment } from '@/lib/environment';
import { cn } from '@/lib/utils';
import { ProdWarning } from '@/components/ui/prod-warning';
import { useOrgStatus } from '@/hooks/org-ops/useOrgStatus';
import { OrgStatusTab } from './org-ops-components/OrgStatusTab';
import { RateLimitsTab } from './org-ops-components/RateLimitsTab';
import { InterdictionsTab } from './org-ops-components/InterdictionsTab';
import { QuotasTab } from './org-ops-components/QuotasTab';
import { CacheTab } from './org-ops-components/CacheTab';
import type { RateLimit, Interdiction, QuotaOverride } from '@/types';

const FIELD_MONO =
  'w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm font-mono text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const PRIMARY_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40';
const TAB_TRIGGER =
  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:text-foreground';

export function OrgOpsPage() {
  const { env, isProduction } = useEnvironment();
  const [orgInput, setOrgInput] = useState('');
  const [orgId, setOrgId] = useState('');

  const { data: status, isLoading, error } = useOrgStatus(env, orgId);

  const rateLimits: RateLimit[] = status?.rate_limit?.rate_limits ?? [];
  const interdictions: Interdiction[] = status?.interdictions?.interdictions ?? [];
  const quotas: QuotaOverride[] = status?.quotas?.items ?? [];

  const tabs = [
    { value: 'status', label: 'Org Status' },
    { value: 'rate-limits', label: `Rate Limits (${rateLimits.length})` },
    { value: 'interdictions', label: `Interdictions (${interdictions.length})` },
    { value: 'quotas', label: `Quota Overrides (${quotas.length})` },
    { value: 'cache', label: 'Cache' },
  ];

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Org Operations</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Manage rate limits, quotas, interdictions, and cache for a specific organization.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={orgInput}
          onChange={(e) => setOrgInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && orgInput.trim()) setOrgId(orgInput.trim());
          }}
          className={cn(FIELD_MONO, 'flex-1')}
        />
        <button
          onClick={() => { if (orgInput.trim()) setOrgId(orgInput.trim()); }}
          className={PRIMARY_BUTTON}
        >
          <Search size={14} />
          Load Org
        </button>
      </div>

      {orgId && error && (
        <div className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {(error as Error).message}
        </div>
      )}

      {orgId && isLoading && (
        <div className="py-8 text-center text-sm animate-pulse text-muted-foreground">
          Loading org data…
        </div>
      )}

      {orgId && status && (
        <>
          <ProdWarning env={env} />

          <Tabs.Root defaultValue="status">
            <Tabs.List className="flex gap-1 border-b border-border mb-6">
              {tabs.map((tab) => (
                <Tabs.Trigger key={tab.value} value={tab.value} className={TAB_TRIGGER}>
                  {tab.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content value="status">
              <OrgStatusTab
                status={status}
                rateLimits={rateLimits}
                interdictions={interdictions}
                quotas={quotas}
              />
            </Tabs.Content>

            <Tabs.Content value="rate-limits">
              <RateLimitsTab
                env={env}
                orgId={orgId}
                rateLimits={rateLimits}
                isProduction={isProduction}
              />
            </Tabs.Content>

            <Tabs.Content value="interdictions">
              <InterdictionsTab
                env={env}
                orgId={orgId}
                interdictions={interdictions}
                isProduction={isProduction}
              />
            </Tabs.Content>

            <Tabs.Content value="quotas">
              <QuotasTab
                env={env}
                orgId={orgId}
                quotas={quotas}
                isProduction={isProduction}
              />
            </Tabs.Content>

            <Tabs.Content value="cache">
              <CacheTab
                env={env}
                orgId={orgId}
                status={status}
                isProduction={isProduction}
              />
            </Tabs.Content>
          </Tabs.Root>
        </>
      )}

      {!orgId && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Enter an org UUID above to load its operations panel.
        </div>
      )}
    </div>
  );
}
