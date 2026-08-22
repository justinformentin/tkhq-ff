/**
 * OrgOpsPage — Org Operations admin panel.
 *
 * Provides org-centric views for:
 *   - Org Status (OrgRefs + aggregate read)
 *   - Rate Limits (get/set/remove + defaults)
 *   - Interdictions (get/set block)
 *   - Quota Overrides (get/set/remove + evaluate dry-run)
 *   - Cache (clear-for-org)
 *
 * All writes against preprod/prod show a production-safety banner matching
 * the convention used elsewhere in the dashboard.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Search,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Plus,
  Play,
} from 'lucide-react';
import { useEnvironment } from '@/lib/environment';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import {
  getOrgStatus,
  getDefaultRateLimits,
  setOrgRateLimit,
  removeOrgRateLimit,
  setOrgInterdictorBlock,
  clearOrgCache,
  evaluateOrgQuota,
  setOrgQuota,
  removeOrgQuota,
} from '@/lib/api';
import type {
  OrgStatusResponse,
  RateLimit,
  Interdiction,
  QuotaOverride,
} from '@/types';
import {
  RATE_LIMIT_RULE_TYPES,
  RATE_LIMIT_REMEDIATIONS,
  RATE_LIMIT_BUCKET_TYPES,
  RATE_LIMIT_RULE_TYPE_NAMES,
  RATE_LIMIT_REMEDIATION_NAMES,
  RATE_LIMIT_BUCKET_TYPE_NAMES,
} from '@/types';

// ---------------------------------------------------------------------------
// Shared control styling
// ---------------------------------------------------------------------------

const FIELD =
  'w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const FIELD_MONO = `${FIELD} font-mono`;

const FIELD_LABEL = 'text-xs mb-1 block text-muted-foreground';

const PRIMARY_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40';

// Radix owns the active state, so the tab colors ride on data attributes.
const TAB_TRIGGER =
  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:text-foreground';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function label<T extends Record<string, string>>(
  names: T,
  value: string
): string {
  return names[value] ?? value;
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card-background p-5',
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-semibold text-sm uppercase tracking-wider mb-4 text-muted-foreground">
      {children}
    </h2>
  );
}

function Field({ label: l, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 text-sm py-2 border-b border-border last:border-0">
      <span className="w-40 shrink-0 font-medium text-muted-foreground">
        {l}
      </span>
      <span className="font-mono break-all text-foreground">{value}</span>
    </div>
  );
}

function ProdWarning({ env }: { env: string }) {
  if (env !== 'preprod' && env !== 'prod') return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-warning-border bg-warning-soft px-4 py-3 text-sm text-warning mb-4">
      <AlertTriangle size={16} className="shrink-0" />
      <span>
        You are targeting <strong>{env.toUpperCase()}</strong>
        {env === 'prod' ? ' — writes affect live customers.' : ''}
      </span>
    </div>
  );
}

function WriteWarning({ env }: { env: string }) {
  return (
    <div className="flex items-center gap-2 text-xs mb-4 px-3 py-2 rounded-md bg-warning-soft text-warning">
      <AlertTriangle size={13} /> This will write to {env.toUpperCase()}.
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rate Limit subcomponent
// ---------------------------------------------------------------------------

function RateLimitRow({
  rl,
  onRemove,
  isProduction,
}: {
  rl: RateLimit;
  onRemove?: () => void;
  isProduction: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card-background px-4 py-3 text-sm space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">
          {label(RATE_LIMIT_RULE_TYPE_NAMES, rl.rule)}
          {rl.rule_variant ? ` / ${rl.rule_variant}` : ''}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-soft text-primary">
            {rl.requests_per_minute} rpm
          </span>
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1 rounded text-danger transition-colors hover:bg-danger-soft"
              title={`Remove this rate limit${isProduction ? ' (LIVE)' : ''}`}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="text-xs space-x-3 text-muted-foreground">
        <span>Category: {label(RATE_LIMIT_RULE_TYPE_NAMES, rl.category)}</span>
        <span>
          Remediation: {label(RATE_LIMIT_REMEDIATION_NAMES, rl.remediation)}
        </span>
        <span>
          Bucket: {label(RATE_LIMIT_BUCKET_TYPE_NAMES, rl.bucket_type)}
        </span>
        {rl.notes && <span>Notes: {rl.notes}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function OrgOpsPage() {
  const { env, isProduction } = useEnvironment();
  const queryClient = useQueryClient();

  const [orgInput, setOrgInput] = useState('');
  const [orgId, setOrgId] = useState('');

  // ---- Set Rate Limit form state ----
  const [rlRps, setRlRps] = useState('100');
  const [rlRule, setRlRule] = useState('RATE_LIMIT_RULE_TYPE_ALL');
  const [rlRuleVariant, setRlRuleVariant] = useState('');
  const [rlRemediation, setRlRemediation] = useState(
    'RATE_LIMIT_REMEDIATION_SOFT_THROTTLE'
  );
  const [rlBucketType, setRlBucketType] = useState(
    'RATE_LIMIT_BUCKET_TYPE_SELF'
  );
  const [rlNotes, setRlNotes] = useState('');

  // ---- Interdictor block form state ----
  const [intScope, setIntScope] = useState('org');
  const [intOp, setIntOp] = useState('all');
  const [intBlocked, setIntBlocked] = useState(true);
  const [intSubOrgId, setIntSubOrgId] = useState('');

  // ---- Quota form state ----
  const [quotaLabel, setQuotaLabel] = useState('');
  const [quotaCount, setQuotaCount] = useState('0');

  // ---- Evaluate quota form state ----
  const [evalLabel, setEvalLabel] = useState('');

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const {
    data: status,
    isLoading,
    error,
  } = useQuery<OrgStatusResponse>({
    queryKey: ['org-status', env, orgId],
    queryFn: () => getOrgStatus(orgId, env),
    enabled: !!orgId,
  });

  const { data: defaults } = useQuery({
    queryKey: ['rate-limit-defaults', env],
    queryFn: () => getDefaultRateLimits(env),
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const setRlMut = useMutation({
    mutationFn: () =>
      setOrgRateLimit(orgId, env, {
        requests_per_second: Number(rlRps),
        rule: rlRule,
        rule_variant: rlRuleVariant || undefined,
        remediation: rlRemediation,
        bucket_type: rlBucketType,
        notes: rlNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({ title: 'Rate limit set', description: `${orgId}` });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const removeRlMut = useMutation({
    mutationFn: (rl: RateLimit) =>
      removeOrgRateLimit(orgId, env, {
        rule: rl.rule,
        rule_variant: rl.rule_variant,
        bucket_type: rl.bucket_type,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({ title: 'Rate limit removed' });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const setIntMut = useMutation({
    mutationFn: () =>
      setOrgInterdictorBlock(orgId, env, {
        scope: intScope,
        op: intOp,
        blocked: intBlocked,
        suborg_id: intSubOrgId || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({
        title: intBlocked ? 'Block set' : 'Block removed',
        description: `Key: ${data.raw_key}`,
      });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const clearCacheMut = useMutation({
    mutationFn: (includeSubOrgs: boolean) =>
      clearOrgCache(orgId, env, includeSubOrgs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({ title: 'Cache cleared', description: `${orgId}` });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const evalQuotaMut = useMutation({
    mutationFn: () => evaluateOrgQuota(orgId, env, evalLabel),
    onSuccess: () =>
      toast({
        title: 'Quota evaluated (dry-run)',
        description: `label: ${evalLabel}`,
      }),
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const setQuotaMut = useMutation({
    mutationFn: () => setOrgQuota(orgId, env, quotaLabel, Number(quotaCount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({
        title: 'Quota override set',
        description: `${quotaLabel} = ${quotaCount}`,
      });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const removeQuotaMut = useMutation({
    mutationFn: (q: QuotaOverride) => removeOrgQuota(orgId, env, q.label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({ title: 'Quota override removed' });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const rateLimits: RateLimit[] = status?.rate_limit?.rate_limits ?? [];
  const interdictions: Interdiction[] =
    status?.interdictions?.interdictions ?? [];
  const quotas: QuotaOverride[] = status?.quotas?.items ?? [];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Org Operations</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Manage rate limits, quotas, interdictions, and cache for a specific
          organization.
        </p>
      </div>

      {/* Org ID search */}
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
          onClick={() => {
            if (orgInput.trim()) setOrgId(orgInput.trim());
          }}
          className={PRIMARY_BUTTON}
        >
          <Search size={14} />
          Load Org
        </button>
      </div>

      {/* Error state */}
      {orgId && error && (
        <div className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {(error as Error).message}
        </div>
      )}

      {/* Loading state */}
      {orgId && isLoading && (
        <div className="py-8 text-center text-sm animate-pulse text-muted-foreground">
          Loading org data…
        </div>
      )}

      {/* Main content — shown once we have a loaded org */}
      {orgId && status && (
        <>
          <ProdWarning env={env} />

          <Tabs.Root defaultValue="status">
            <Tabs.List className="flex gap-1 border-b border-border mb-6">
              {[
                { value: 'status', label: 'Org Status' },
                {
                  value: 'rate-limits',
                  label: `Rate Limits (${rateLimits.length})`,
                },
                {
                  value: 'interdictions',
                  label: `Interdictions (${interdictions.length})`,
                },
                {
                  value: 'quotas',
                  label: `Quota Overrides (${quotas.length})`,
                },
                { value: 'cache', label: 'Cache' },
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

            {/* ---------------------------------------------------------------- */}
            {/* Org Status Tab                                                    */}
            {/* ---------------------------------------------------------------- */}
            <Tabs.Content value="status">
              <Card>
                <SectionTitle>Org Refs</SectionTitle>
                <Field label="Org ID" value={status.refs.org_id} />
                <Field
                  label="Billing Org ID"
                  value={status.refs.billing_org_id || '—'}
                />
                <Field
                  label="Customer ID"
                  value={status.refs.customer_id || '—'}
                />
                <Field
                  label="Product Type"
                  value={status.refs.product_type || '—'}
                />
                {status.refs.product_sub_type && (
                  <Field
                    label="Product Sub-Type"
                    value={status.refs.product_sub_type}
                  />
                )}
                <Field
                  label="Cached"
                  value={
                    <span
                      className={
                        status.refs.is_cached
                          ? 'text-success'
                          : 'text-muted-foreground'
                      }
                    >
                      {status.refs.is_cached ? 'Yes' : 'No'}
                    </span>
                  }
                />
              </Card>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <Card>
                  <p className="text-xs uppercase tracking-wider mb-1 text-muted-foreground">
                    Rate Limits
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {rateLimits.length}
                  </p>
                </Card>
                <Card>
                  <p className="text-xs uppercase tracking-wider mb-1 text-muted-foreground">
                    Interdictions
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {interdictions.length}
                  </p>
                </Card>
                <Card>
                  <p className="text-xs uppercase tracking-wider mb-1 text-muted-foreground">
                    Quota Overrides
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {quotas.length}
                  </p>
                </Card>
              </div>
            </Tabs.Content>

            {/* ---------------------------------------------------------------- */}
            {/* Rate Limits Tab                                                   */}
            {/* ---------------------------------------------------------------- */}
            <Tabs.Content value="rate-limits" className="space-y-6">
              {/* Existing limits */}
              <Card>
                <SectionTitle>Current Rate Limits</SectionTitle>
                {rateLimits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No rate limits found for this org.
                  </p>
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

              {/* Set rate limit */}
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
                    <select
                      value={rlRule}
                      onChange={(e) => setRlRule(e.target.value)}
                      className={FIELD}
                    >
                      {RATE_LIMIT_RULE_TYPES.map(({ value, label: lbl }) => (
                        <option key={value} value={value}>
                          {lbl}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>
                      Rule Variant (optional)
                    </label>
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
                        <option key={value} value={value}>
                          {lbl}
                        </option>
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
                        <option key={value} value={value}>
                          {lbl}
                        </option>
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
                  onClick={() => setRlMut.mutate()}
                  disabled={setRlMut.isPending}
                  className={cn(PRIMARY_BUTTON, 'mt-4')}
                >
                  <Plus size={14} />
                  {setRlMut.isPending ? 'Setting…' : 'Set Rate Limit'}
                </button>
              </Card>

              {/* Default rate limits */}
              {defaults && defaults.limits && defaults.limits.length > 0 && (
                <Card>
                  <SectionTitle>Default Rate Limits (system-wide)</SectionTitle>
                  <div className="space-y-2">
                    {defaults.limits.map((rl, i) => (
                      <RateLimitRow
                        key={i}
                        rl={rl}
                        isProduction={isProduction}
                      />
                    ))}
                  </div>
                </Card>
              )}
            </Tabs.Content>

            {/* ---------------------------------------------------------------- */}
            {/* Interdictions Tab                                                 */}
            {/* ---------------------------------------------------------------- */}
            <Tabs.Content value="interdictions" className="space-y-6">
              <Card>
                <SectionTitle>Active Interdictions</SectionTitle>
                {interdictions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No interdictions for this org.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {interdictions.map((int) => (
                      <div
                        key={int.key}
                        className="rounded-lg border border-border bg-card-background px-4 py-3 text-sm"
                      >
                        <p className="font-mono font-medium text-foreground">
                          {int.key}
                        </p>
                        {int.owners.length > 0 && (
                          <p className="text-xs mt-1 text-muted-foreground">
                            Owners: {int.owners.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <SectionTitle>Set / Remove Interdictor Block</SectionTitle>
                {isProduction && <WriteWarning env={env} />}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={FIELD_LABEL}>Scope</label>
                    <input
                      type="text"
                      value={intScope}
                      onChange={(e) => setIntScope(e.target.value)}
                      placeholder="e.g. org"
                      className={FIELD}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Op</label>
                    <input
                      type="text"
                      value={intOp}
                      onChange={(e) => setIntOp(e.target.value)}
                      placeholder="e.g. all"
                      className={FIELD}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Sub-Org ID (optional)</label>
                    <input
                      type="text"
                      value={intSubOrgId}
                      onChange={(e) => setIntSubOrgId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className={FIELD_MONO}
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className={FIELD_LABEL}>Action</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIntBlocked(true)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                          intBlocked
                            ? 'border-primary-border bg-primary-soft text-primary'
                            : 'border-transparent text-muted-foreground'
                        )}
                      >
                        Block
                      </button>
                      <button
                        onClick={() => setIntBlocked(false)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                          !intBlocked
                            ? 'border-primary-border bg-primary-soft text-primary'
                            : 'border-transparent text-muted-foreground'
                        )}
                      >
                        Unblock
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIntMut.mutate()}
                  disabled={setIntMut.isPending}
                  className={cn(
                    'mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground transition-colors disabled:opacity-40',
                    intBlocked
                      ? 'bg-danger hover:opacity-90'
                      : 'bg-primary hover:bg-primary-hover'
                  )}
                >
                  {setIntMut.isPending
                    ? 'Applying…'
                    : intBlocked
                      ? 'Set Block'
                      : 'Remove Block'}
                </button>
              </Card>
            </Tabs.Content>

            {/* ---------------------------------------------------------------- */}
            {/* Quota Overrides Tab                                               */}
            {/* ---------------------------------------------------------------- */}
            <Tabs.Content value="quotas" className="space-y-6">
              {/* Existing overrides */}
              <Card>
                <SectionTitle>Current Quota Overrides</SectionTitle>
                {quotas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No quota overrides for this org.
                  </p>
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
                          <td className="py-2 font-mono text-foreground">
                            {q.label}
                          </td>
                          <td className="py-2 text-right font-mono text-foreground">
                            {q.count}
                          </td>
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

              {/* Set override */}
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
                  onClick={() => setQuotaMut.mutate()}
                  disabled={setQuotaMut.isPending || !quotaLabel}
                  className={cn(PRIMARY_BUTTON, 'mt-4')}
                >
                  <Plus size={14} />
                  {setQuotaMut.isPending ? 'Setting…' : 'Set Override'}
                </button>
              </Card>

              {/* Evaluate quota dry-run */}
              <Card>
                <SectionTitle>Evaluate Quota (Dry-run)</SectionTitle>
                <p className="text-sm mb-4 text-muted-foreground">
                  Runs a quota evaluation in dry-run mode — emits logs for
                  troubleshooting without actually blocking or unblocking.
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
                    onClick={() => evalQuotaMut.mutate()}
                    disabled={evalQuotaMut.isPending || !evalLabel}
                    className={PRIMARY_BUTTON}
                  >
                    <Play size={14} />
                    {evalQuotaMut.isPending ? 'Running…' : 'Evaluate'}
                  </button>
                </div>
              </Card>
            </Tabs.Content>

            {/* ---------------------------------------------------------------- */}
            {/* Cache Tab                                                         */}
            {/* ---------------------------------------------------------------- */}
            <Tabs.Content value="cache" className="space-y-4">
              <Card>
                <SectionTitle>Cache Status</SectionTitle>
                <Field
                  label="Currently cached"
                  value={
                    <span
                      className={
                        status.refs.is_cached
                          ? 'text-success'
                          : 'text-muted-foreground'
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
                  Forces a cache eviction for this org, triggering a fresh pull
                  of billing ID and product type from the database on the next
                  request.
                </p>
                {isProduction && <WriteWarning env={env} />}
                <div className="flex gap-3">
                  <button
                    onClick={() => clearCacheMut.mutate(false)}
                    disabled={clearCacheMut.isPending}
                    className={PRIMARY_BUTTON}
                  >
                    <RefreshCw size={14} />
                    {clearCacheMut.isPending
                      ? 'Clearing…'
                      : 'Clear Cache (org only)'}
                  </button>
                  <button
                    onClick={() => clearCacheMut.mutate(true)}
                    disabled={clearCacheMut.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground transition-colors hover:bg-hover-overlay hover:text-foreground disabled:opacity-40"
                  >
                    <RefreshCw size={14} />
                    {clearCacheMut.isPending
                      ? 'Clearing…'
                      : 'Clear Cache (+ sub-orgs)'}
                  </button>
                </div>
              </Card>
            </Tabs.Content>
          </Tabs.Root>
        </>
      )}

      {/* Prompt when no org is loaded yet */}
      {!orgId && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Enter an org UUID above to load its operations panel.
        </div>
      )}
    </div>
  );
}
