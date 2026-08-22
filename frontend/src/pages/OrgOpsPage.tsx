/**
 * OrgOpsPage — Org Operations admin panel (thin orchestrator).
 *
 * Delegates to tab sub-components in org-ops-components/:
 *   OrgStatusTab, RateLimitsTab, InterdictionsTab, QuotasTab, CacheTab
 */

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useEnvironment } from '@/lib/environment';
import { ProdWarning } from '@/components/ui/prod-warning';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrgStatus } from '@/hooks/org-ops/useOrgStatus';
import { OrgStatusTab } from './org-ops-components/OrgStatusTab';
import { RateLimitsTab } from './org-ops-components/RateLimitsTab';
import { InterdictionsTab } from './org-ops-components/InterdictionsTab';
import { QuotasTab } from './org-ops-components/QuotasTab';
import { CacheTab } from './org-ops-components/CacheTab';
import type { RateLimit, Interdiction, QuotaOverride } from '@/types';

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
        <Input
          mono
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={orgInput}
          onChange={(e) => setOrgInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && orgInput.trim()) setOrgId(orgInput.trim());
          }}
          className="flex-1"
        />
        <Button onClick={() => { if (orgInput.trim()) setOrgId(orgInput.trim()); }}>
          <Search size={14} />
          Load Org
        </Button>
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

          <Tabs defaultValue="status">
            <TabsList className="mb-6">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="status">
              <OrgStatusTab
                status={status}
                rateLimits={rateLimits}
                interdictions={interdictions}
                quotas={quotas}
              />
            </TabsContent>

            <TabsContent value="rate-limits">
              <RateLimitsTab
                env={env}
                orgId={orgId}
                rateLimits={rateLimits}
                isProduction={isProduction}
              />
            </TabsContent>

            <TabsContent value="interdictions">
              <InterdictionsTab
                env={env}
                orgId={orgId}
                interdictions={interdictions}
                isProduction={isProduction}
              />
            </TabsContent>

            <TabsContent value="quotas">
              <QuotasTab
                env={env}
                orgId={orgId}
                quotas={quotas}
                isProduction={isProduction}
              />
            </TabsContent>

            <TabsContent value="cache">
              <CacheTab
                env={env}
                orgId={orgId}
                status={status}
                isProduction={isProduction}
              />
            </TabsContent>
          </Tabs>
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
