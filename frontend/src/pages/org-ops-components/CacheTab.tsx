/**
 * CacheTab — Cache status and clear controls for an org.
 */

import { RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { FieldDisplay } from '@/components/ui/field-display';
import { WriteWarning } from '@/components/ui/write-warning';
import { useClearOrgCache } from '@/hooks/org-ops/useOrgCache';
import type { OrgStatusResponse } from '@/types';
import type { Environment } from '@/lib/environment';

const PRIMARY_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40';

interface CacheTabProps {
  env: Environment;
  orgId: string;
  status: OrgStatusResponse;
  isProduction: boolean;
}

export function CacheTab({ env, orgId, status, isProduction }: CacheTabProps) {
  const clearCacheMut = useClearOrgCache(env, orgId);

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Cache Status</SectionTitle>
        <FieldDisplay
          label="Currently cached"
          value={
            <span
              className={
                status.refs.is_cached ? 'text-success' : 'text-muted-foreground'
              }
            >
              {status.refs.is_cached
                ? 'Yes — org refs are in Redis cache'
                : 'No — data will be pulled fresh from DB'}
            </span>
          }
        />
      </Card>

      <Card>
        <SectionTitle>Clear Cache for Org</SectionTitle>
        <p className="text-sm mb-4 text-muted-foreground">
          Forces a cache eviction for this org, triggering a fresh pull of billing ID and
          product type from the database on the next request.
        </p>
        {isProduction && <WriteWarning env={env} />}
        <div className="flex gap-3">
          <button
            onClick={() => clearCacheMut.mutate(false)}
            disabled={clearCacheMut.isPending}
            className={PRIMARY_BUTTON}
          >
            <RefreshCw size={14} />
            {clearCacheMut.isPending ? 'Clearing…' : 'Clear Cache (org only)'}
          </button>
          <button
            onClick={() => clearCacheMut.mutate(true)}
            disabled={clearCacheMut.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground transition-colors hover:bg-hover-overlay hover:text-foreground disabled:opacity-40"
          >
            <RefreshCw size={14} />
            {clearCacheMut.isPending ? 'Clearing…' : 'Clear Cache (+ sub-orgs)'}
          </button>
        </div>
      </Card>
    </div>
  );
}
