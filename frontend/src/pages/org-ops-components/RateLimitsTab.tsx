/**
 * RateLimitsTab — View current rate limits, set override, view defaults.
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { WriteWarning } from '@/components/ui/write-warning';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
          <Field label="Requests / Second" htmlFor="rl-rps">
            <Input
              id="rl-rps"
              type="number"
              value={rlRps}
              onChange={(e) => setRlRps(e.target.value)}
              min={1}
            />
          </Field>
          <Field label="Rule" htmlFor="rl-rule">
            <Select
              id="rl-rule"
              value={rlRule}
              onChange={(e) => setRlRule(e.target.value)}
              options={RATE_LIMIT_RULE_TYPES}
            />
          </Field>
          <Field label="Rule Variant (optional)" htmlFor="rl-rule-variant">
            <Input
              id="rl-rule-variant"
              value={rlRuleVariant}
              onChange={(e) => setRlRuleVariant(e.target.value)}
              placeholder="e.g. variant name"
            />
          </Field>
          <Field label="Remediation" htmlFor="rl-remediation">
            <Select
              id="rl-remediation"
              value={rlRemediation}
              onChange={(e) => setRlRemediation(e.target.value)}
              options={RATE_LIMIT_REMEDIATIONS}
            />
          </Field>
          <Field label="Bucket Type" htmlFor="rl-bucket-type">
            <Select
              id="rl-bucket-type"
              value={rlBucketType}
              onChange={(e) => setRlBucketType(e.target.value)}
              options={RATE_LIMIT_BUCKET_TYPES}
            />
          </Field>
          <Field label="Notes" htmlFor="rl-notes">
            <Input
              id="rl-notes"
              value={rlNotes}
              onChange={(e) => setRlNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </Field>
        </div>
        <Button
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
          className="mt-4"
        >
          <Plus size={14} />
          {setRlMut.isPending ? 'Setting…' : 'Set Rate Limit'}
        </Button>
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
