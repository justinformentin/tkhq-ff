import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { FieldDisplay } from '@/components/ui/field-display';
import { VerBadge } from '@/components/ui/ver-badge';
import { Button } from '@/components/ui/button';
import type { SesDomainResponse } from '@/types';

interface SesDomainPanelProps {
  data: SesDomainResponse;
  onRefresh: () => void;
  refreshPending: boolean;
  isProduction: boolean;
}

export function SesDomainPanel({
  data,
  onRefresh,
  refreshPending,
  isProduction,
}: SesDomainPanelProps) {
  return (
    <div className="mt-5 space-y-4">
      <div className="space-y-0">
        <FieldDisplay label="Identity Name" value={data.identity_name} labelWidth="w-44" />
        <FieldDisplay
          label="Config Set"
          value={data.configuration_set_name || '—'}
          labelWidth="w-44"
        />
        <FieldDisplay
          label="Mail-From Domain"
          value={data.mail_from_domain || '—'}
          labelWidth="w-44"
        />
        <FieldDisplay
          label="Tenants"
          value={
            data.tenant_names.length > 0
              ? data.tenant_names.join(', ')
              : '—'
          }
          labelWidth="w-44"
        />
        <FieldDisplay
          label="Verified for Sending"
          value={
            data.verified_for_sending ? (
              <span className="text-success inline-flex items-center gap-1">
                <CheckCircle size={13} /> Yes
              </span>
            ) : (
              <span className="text-danger inline-flex items-center gap-1">
                <XCircle size={13} /> No
              </span>
            )
          }
          labelWidth="w-44"
        />
        <FieldDisplay
          label="Verification Status"
          value={<VerBadge status={data.verification_status} />}
          labelWidth="w-44"
        />
        <FieldDisplay
          label="DKIM Status"
          value={<VerBadge status={data.dkim_status} />}
          labelWidth="w-44"
        />
        <FieldDisplay
          label="Mail-From Status"
          value={<VerBadge status={data.mail_from_domain_status} />}
          labelWidth="w-44"
        />
      </div>

      {data.dns_records && data.dns_records.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
            DNS Records
          </p>
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Value</th>
                  <th className="text-left px-3 py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {data.dns_records.map((rec, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-foreground">{rec.type}</td>
                    <td className="px-3 py-2 break-all text-foreground">
                      {rec.name}
                    </td>
                    <td className="px-3 py-2 break-all text-foreground">
                      {rec.value}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {rec.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="pt-2">
        {isProduction && (
          <div className="flex items-center gap-2 text-xs mb-3 px-3 py-2 rounded-md bg-warning-soft text-warning">
            <AlertTriangle size={13} /> Refreshing resets DNS verification.
          </div>
        )}
        <Button
          variant="warning-soft"
          onClick={onRefresh}
          disabled={refreshPending}
        >
          <RefreshCw size={14} />
          {refreshPending ? 'Refreshing…' : 'Refresh SES Domain'}
        </Button>
      </div>
    </div>
  );
}
