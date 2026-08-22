/**
 * CacheTab — Cache status and clear controls for an org.
 */

import { RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { FieldDisplay } from '@/components/ui/field-display';
import { WriteWarning } from '@/components/ui/write-warning';
import { Button } from '@/components/ui/button';
import { useClearOrgCache } from '@/hooks/org-ops/useOrgCache';
import type { OrgStatusResponse } from '@/types';
import type { Environment } from '@/lib/environment';

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
          <Button
            onClick={() => clearCacheMut.mutate(false)}
            disabled={clearCacheMut.isPending}
          >
            <RefreshCw size={14} />
            {clearCacheMut.isPending ? 'Clearing…' : 'Clear Cache (org only)'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => clearCacheMut.mutate(true)}
            disabled={clearCacheMut.isPending}
          >
            <RefreshCw size={14} />
            {clearCacheMut.isPending ? 'Clearing…' : 'Clear Cache (+ sub-orgs)'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
