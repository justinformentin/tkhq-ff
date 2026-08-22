/**
 * QuotasTab — View quota overrides, set override, evaluate quota (dry-run).
 */

import { useState } from 'react';
import { Trash2, Plus, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { WriteWarning } from '@/components/ui/write-warning';
import {
  useEvaluateOrgQuota,
  useSetOrgQuota,
  useRemoveOrgQuota,
} from '@/hooks/org-ops/useOrgQuotaMutations';
import type { QuotaOverride } from '@/types';
import type { Environment } from '@/lib/environment';

const FIELD =
  'w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const FIELD_LABEL = 'text-xs mb-1 block text-muted-foreground';
const PRIMARY_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40';

interface QuotasTabProps {
  env: Environment;
  orgId: string;
  quotas: QuotaOverride[];
  isProduction: boolean;
}

export function QuotasTab({ env, orgId, quotas, isProduction }: QuotasTabProps) {
  const [quotaLabel, setQuotaLabel] = useState('');
  const [quotaCount, setQuotaCount] = useState('0');
  const [evalLabel, setEvalLabel] = useState('');

  const evalQuotaMut = useEvaluateOrgQuota(env, orgId);
  const setQuotaMut = useSetOrgQuota(env, orgId);
  const removeQuotaMut = useRemoveOrgQuota(env, orgId);

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle>Current Quota Overrides</SectionTitle>
        {quotas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quota overrides for this org.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="text-left pb-2">Label</th>
                <th className="text-right pb-2">Count</th>
                <th className="text-right pb-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotas.map((q) => (
                <tr key={q.label}>
                  <td className="py-2 font-mono text-foreground">{q.label}</td>
                  <td className="py-2 text-right font-mono text-foreground">{q.count}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => removeQuotaMut.mutate(q)}
                      disabled={removeQuotaMut.isPending}
                      className="p-1 rounded text-danger transition-colors hover:bg-danger-soft disabled:opacity-40"
                      title={`Remove override${isProduction ? ' (LIVE)' : ''}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <SectionTitle>Set Quota Override</SectionTitle>
        {isProduction && <WriteWarning env={env} />}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={FIELD_LABEL}>Label</label>
            <input
              type="text"
              value={quotaLabel}
              onChange={(e) => setQuotaLabel(e.target.value)}
              placeholder="e.g. api_calls_per_month"
              className={FIELD}
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>Count</label>
            <input
              type="number"
              value={quotaCount}
              onChange={(e) => setQuotaCount(e.target.value)}
              className={FIELD}
            />
          </div>
        </div>
        <button
          onClick={() =>
            setQuotaMut.mutate({ label: quotaLabel, count: Number(quotaCount) })
          }
          disabled={setQuotaMut.isPending || !quotaLabel}
          className={cn(PRIMARY_BUTTON, 'mt-4')}
        >
          <Plus size={14} />
          {setQuotaMut.isPending ? 'Setting…' : 'Set Override'}
        </button>
      </Card>

      <Card>
        <SectionTitle>Evaluate Quota (Dry-run)</SectionTitle>
        <p className="text-sm mb-4 text-muted-foreground">
          Runs a quota evaluation in dry-run mode — emits logs for troubleshooting without
          actually blocking or unblocking.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={evalLabel}
            onChange={(e) => setEvalLabel(e.target.value)}
            placeholder="Label, e.g. api_calls_per_month"
            className={cn(FIELD, 'flex-1')}
          />
          <button
            onClick={() => evalQuotaMut.mutate(evalLabel)}
            disabled={evalQuotaMut.isPending || !evalLabel}
            className={PRIMARY_BUTTON}
          >
            <Play size={14} />
            {evalQuotaMut.isPending ? 'Running…' : 'Evaluate'}
          </button>
        </div>
      </Card>
    </div>
  );
}
