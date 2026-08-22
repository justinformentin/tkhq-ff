/**
 * OrgStatusTab — Org refs summary + stat counters.
 */

import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { FieldDisplay } from '@/components/ui/field-display';
import type { OrgStatusResponse, RateLimit, Interdiction, QuotaOverride } from '@/types';

interface OrgStatusTabProps {
  status: OrgStatusResponse;
  rateLimits: RateLimit[];
  interdictions: Interdiction[];
  quotas: QuotaOverride[];
}

export function OrgStatusTab({
  status,
  rateLimits,
  interdictions,
  quotas,
}: OrgStatusTabProps) {
  return (
    <>
      <Card>
        <SectionTitle>Org Refs</SectionTitle>
        <FieldDisplay label="Org ID" value={status.refs.org_id} />
        <FieldDisplay label="Billing Org ID" value={status.refs.billing_org_id || '—'} />
        <FieldDisplay label="Customer ID" value={status.refs.customer_id || '—'} />
        <FieldDisplay label="Product Type" value={status.refs.product_type || '—'} />
        {status.refs.product_sub_type && (
          <FieldDisplay label="Product Sub-Type" value={status.refs.product_sub_type} />
        )}
        <FieldDisplay
          label="Cached"
          value={
            <span className={status.refs.is_cached ? 'text-success' : 'text-muted-foreground'}>
              {status.refs.is_cached ? 'Yes' : 'No'}
            </span>
          }
        />
      </Card>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs uppercase tracking-wider mb-1 text-muted-foreground">Rate Limits</p>
          <p className="text-2xl font-bold text-foreground">{rateLimits.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider mb-1 text-muted-foreground">Interdictions</p>
          <p className="text-2xl font-bold text-foreground">{interdictions.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider mb-1 text-muted-foreground">Quota Overrides</p>
          <p className="text-2xl font-bold text-foreground">{quotas.length}</p>
        </Card>
      </div>
    </>
  );
}
