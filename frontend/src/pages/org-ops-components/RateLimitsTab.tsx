/**
 * RateLimitsTab — View current rate limits, set override, view defaults.
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { WriteWarning } from '@/components/ui/write-warning';
import { RateLimitRow } from './RateLimitRow';
import {
  useSetOrgRateLimit,
  useRemoveOrgRateLimit,
} from '@/hooks/org-ops/useOrgRateLimitMutations';
import { useDefaultRateLimits } from '@/hooks/org-ops/useDefaultRateLimits';
import type { RateLimit } from '@/types';
import {
  RATE_LIMIT_RULE_TYPES,
  RATE_LIMIT_REMEDIATIONS,
  RATE_LIMIT_BUCKET_TYPES,
} from '@/types';
import type { Environment } from '@/lib/environment';

const FIELD =
  'w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const FIELD_LABEL = 'text-xs mb-1 block text-muted-foreground';
const PRIMARY_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40';

interface RateLimitsTabProps {
  env: Environment;
  orgId: string;
  rateLimits: RateLimit[];
  isProduction: boolean;
}

export function RateLimitsTab({
  env,
  orgId,
  rateLimits,
  isProduction,
}: RateLimitsTabProps) {
  const [rlRps, setRlRps] = useState('100');
  const [rlRule, setRlRule] = useState('RATE_LIMIT_RULE_TYPE_ALL');
  const [rlRuleVariant, setRlRuleVariant] = useState('');
  const [rlRemediation, setRlRemediation] = useState('RATE_LIMIT_REMEDIATION_SOFT_THROTTLE');
  const [rlBucketType, setRlBucketType] = useState('RATE_LIMIT_BUCKET_TYPE_SELF');
  const [rlNotes, setRlNotes] = useState('');

  const setRlMut = useSetOrgRateLimit(env, orgId);
  const removeRlMut = useRemoveOrgRateLimit(env, orgId);
  const { data: defaults } = useDefaultRateLimits(env);

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle>Current Rate Limits</SectionTitle>
        {rateLimits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rate limits found for this org.</p>
        ) : (
          <div className="space-y-2">
            {rateLimits.map((rl, i) => (
              <RateLimitRow
                key={i}
                rl={rl}
                isProduction={isProduction}
                onRemove={
                  rl.category?.startsWith('RATE_LIMIT_CATEGORY_CUSTOM')
                    ? () => removeRlMut.mutate(rl)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Set Rate Limit Override</SectionTitle>
        {isProduction && <WriteWarning env={env} />}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={FIELD_LABEL}>Requests / Second</label>
            <input
              type="number"
              value={rlRps}
              onChange={(e) => setRlRps(e.target.value)}
              min={1}
              className={FIELD}
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>Rule</label>
            <select value={rlRule} onChange={(e) => setRlRule(e.target.value)} className={FIELD}>
              {RATE_LIMIT_RULE_TYPES.map(({ value, label: lbl }) => (
                <option key={value} value={value}>{lbl}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={FIELD_LABEL}>Rule Variant (optional)</label>
            <input
              type="text"
              value={rlRuleVariant}
              onChange={(e) => setRlRuleVariant(e.target.value)}
              placeholder="e.g. variant name"
              className={FIELD}
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>Remediation</label>
            <select
              value={rlRemediation}
              onChange={(e) => setRlRemediation(e.target.value)}
              className={FIELD}
            >
              {RATE_LIMIT_REMEDIATIONS.map(({ value, label: lbl }) => (
                <option key={value} value={value}>{lbl}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={FIELD_LABEL}>Bucket Type</label>
            <select
              value={rlBucketType}
              onChange={(e) => setRlBucketType(e.target.value)}
              className={FIELD}
            >
              {RATE_LIMIT_BUCKET_TYPES.map(({ value, label: lbl }) => (
                <option key={value} value={value}>{lbl}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={FIELD_LABEL}>Notes</label>
            <input
              type="text"
              value={rlNotes}
              onChange={(e) => setRlNotes(e.target.value)}
              placeholder="Optional notes"
              className={FIELD}
            />
          </div>
        </div>
        <button
          onClick={() =>
            setRlMut.mutate({
              requests_per_second: Number(rlRps),
              rule: rlRule,
              rule_variant: rlRuleVariant || undefined,
              remediation: rlRemediation,
              bucket_type: rlBucketType,
              notes: rlNotes,
            })
          }
          disabled={setRlMut.isPending}
          className={cn(PRIMARY_BUTTON, 'mt-4')}
        >
          <Plus size={14} />
          {setRlMut.isPending ? 'Setting…' : 'Set Rate Limit'}
        </button>
      </Card>

      {defaults && defaults.limits && defaults.limits.length > 0 && (
        <Card>
          <SectionTitle>Default Rate Limits (system-wide)</SectionTitle>
          <div className="space-y-2">
            {defaults.limits.map((rl, i) => (
              <RateLimitRow key={i} rl={rl} isProduction={isProduction} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
