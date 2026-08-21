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
import { Search, AlertTriangle, RefreshCw, Trash2, Plus, Play } from 'lucide-react';
import { useEnvironment } from '@/lib/environment';
import { toast } from '@/hooks/useToast';
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
// Helpers
// ---------------------------------------------------------------------------

function label<T extends Record<string, string>>(names: T, value: string): string {
  return names[value] ?? value;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg border p-5 ${className}`}
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-semibold text-sm uppercase tracking-wider mb-4"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {children}
    </h2>
  );
}

function Field({ label: l, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 text-sm py-2 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
      <span className="w-40 shrink-0 font-medium" style={{ color: 'var(--color-text-muted)' }}>{l}</span>
      <span className="font-mono break-all" style={{ color: 'var(--color-text)' }}>{value}</span>
    </div>
  );
}

function ProdWarning({ env }: { env: string }) {
  if (env !== 'preprod' && env !== 'prod') return null;
  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm mb-4"
      style={{ borderColor: 'var(--color-warning, #f59e0b)', color: 'var(--color-warning, #f59e0b)', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}
    >
      <AlertTriangle size={16} className="shrink-0" />
      <span>
        You are targeting <strong>{env.toUpperCase()}</strong> — writes affect live customers.
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rate Limit subcomponent
// ---------------------------------------------------------------------------

function RateLimitRow({ rl, onRemove, isProduction }: { rl: RateLimit; onRemove?: () => void; isProduction: boolean }) {
  return (
    <div
      className="rounded-lg border px-4 py-3 text-sm space-y-1"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium" style={{ color: 'var(--color-text)' }}>
          {label(RATE_LIMIT_RULE_TYPE_NAMES, rl.rule)}
          {rl.rule_variant ? ` / ${rl.rule_variant}` : ''}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: 'var(--color-primary)' }}>
            {rl.requests_per_minute} rpm
          </span>
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1 rounded hover:bg-red-500/10 transition-colors"
              title={`Remove this rate limit${isProduction ? ' (LIVE)' : ''}`}
            >
              <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
            </button>
          )}
        </div>
      </div>
      <div className="text-xs space-x-3" style={{ color: 'var(--color-text-muted)' }}>
        <span>Category: {label(RATE_LIMIT_RULE_TYPE_NAMES, rl.category)}</span>
        <span>Remediation: {label(RATE_LIMIT_REMEDIATION_NAMES, rl.remediation)}</span>
        <span>Bucket: {label(RATE_LIMIT_BUCKET_TYPE_NAMES, rl.bucket_type)}</span>
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
  const [rlRemediation, setRlRemediation] = useState('RATE_LIMIT_REMEDIATION_SOFT_THROTTLE');
  const [rlBucketType, setRlBucketType] = useState('RATE_LIMIT_BUCKET_TYPE_SELF');
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

  const { data: status, isLoading, error } = useQuery<OrgStatusResponse>({
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
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
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
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
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
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const clearCacheMut = useMutation({
    mutationFn: (includeSubOrgs: boolean) => clearOrgCache(orgId, env, includeSubOrgs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({ title: 'Cache cleared', description: `${orgId}` });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const evalQuotaMut = useMutation({
    mutationFn: () => evaluateOrgQuota(orgId, env, evalLabel),
    onSuccess: () => toast({ title: 'Quota evaluated (dry-run)', description: `label: ${evalLabel}` }),
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const setQuotaMut = useMutation({
    mutationFn: () => setOrgQuota(orgId, env, quotaLabel, Number(quotaCount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({ title: 'Quota override set', description: `${quotaLabel} = ${quotaCount}` });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const removeQuotaMut = useMutation({
    mutationFn: (q: QuotaOverride) => removeOrgQuota(orgId, env, q.label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-status', env, orgId] });
      toast({ title: 'Quota override removed' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const rateLimits: RateLimit[] = status?.rate_limit?.rate_limits ?? [];
  const interdictions: Interdiction[] = status?.interdictions?.interdictions ?? [];
  const quotas: QuotaOverride[] = status?.quotas?.items ?? [];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Org Operations
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Manage rate limits, quotas, interdictions, and cache for a specific organization.
        </p>
      </div>

      {/* Org ID search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={orgInput}
          onChange={(e) => setOrgInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && orgInput.trim()) setOrgId(orgInput.trim()); }}
          className="flex-1 px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
        <button
          onClick={() => { if (orgInput.trim()) setOrgId(orgInput.trim()); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          <Search size={14} />
          Load Org
        </button>
      </div>

      {/* Error state */}
      {orgId && error && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
        >
          {(error as Error).message}
        </div>
      )}

      {/* Loading state */}
      {orgId && isLoading && (
        <div className="py-8 text-center text-sm animate-pulse" style={{ color: 'var(--color-text-muted)' }}>
          Loading org data…
        </div>
      )}

      {/* Main content — shown once we have a loaded org */}
      {orgId && status && (
        <>
          <ProdWarning env={env} />

          <Tabs.Root defaultValue="status">
            <Tabs.List
              className="flex gap-1 border-b mb-6"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {[
                { value: 'status', label: 'Org Status' },
                { value: 'rate-limits', label: `Rate Limits (${rateLimits.length})` },
                { value: 'interdictions', label: `Interdictions (${interdictions.length})` },
                { value: 'quotas', label: `Quota Overrides (${quotas.length})` },
                { value: 'cache', label: 'Cache' },
              ].map((tab) => (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors data-[state=active]:border-indigo-500 data-[state=inactive]:border-transparent"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={(e) => {
                    if (e.currentTarget.getAttribute('data-state') !== 'active')
                      (e.currentTarget as HTMLElement).style.color = 'var(--color-text)';
                  }}
                  onMouseLeave={(e) => {
                    if (e.currentTarget.getAttribute('data-state') !== 'active')
                      (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
                  }}
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
                <Field label="Billing Org ID" value={status.refs.billing_org_id || '—'} />
                <Field label="Customer ID" value={status.refs.customer_id || '—'} />
                <Field label="Product Type" value={status.refs.product_type || '—'} />
                {status.refs.product_sub_type && (
                  <Field label="Product Sub-Type" value={status.refs.product_sub_type} />
                )}
                <Field
                  label="Cached"
                  value={
                    <span style={{ color: status.refs.is_cached ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                      {status.refs.is_cached ? 'Yes' : 'No'}
                    </span>
                  }
                />
              </Card>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <Card>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Rate Limits</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{rateLimits.length}</p>
                </Card>
                <Card>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Interdictions</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{interdictions.length}</p>
                </Card>
                <Card>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Quota Overrides</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{quotas.length}</p>
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
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No rate limits found for this org.</p>
                ) : (
                  <div className="space-y-2">
                    {rateLimits.map((rl, i) => (
                      <RateLimitRow
                        key={i}
                        rl={rl}
                        isProduction={isProduction}
                        onRemove={rl.category?.startsWith('RATE_LIMIT_CATEGORY_CUSTOM') ? () => removeRlMut.mutate(rl) : undefined}
                      />
                    ))}
                  </div>
                )}
              </Card>

              {/* Set rate limit */}
              <Card>
                <SectionTitle>Set Rate Limit Override</SectionTitle>
                {isProduction && (
                  <div className="flex items-center gap-2 text-xs mb-4 px-3 py-2 rounded-md"
                    style={{ backgroundColor: 'rgba(245,158,11,0.10)', color: 'var(--color-warning, #f59e0b)' }}>
                    <AlertTriangle size={13} /> This will write to {env.toUpperCase()}.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Requests / Second</label>
                    <input type="number" value={rlRps} onChange={(e) => setRlRps(e.target.value)} min={1}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Rule</label>
                    <select value={rlRule} onChange={(e) => setRlRule(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      {RATE_LIMIT_RULE_TYPES.map(({ value, label: lbl }) => (
                        <option key={value} value={value}>{lbl}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Rule Variant (optional)</label>
                    <input type="text" value={rlRuleVariant} onChange={(e) => setRlRuleVariant(e.target.value)}
                      placeholder="e.g. variant name"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Remediation</label>
                    <select value={rlRemediation} onChange={(e) => setRlRemediation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      {RATE_LIMIT_REMEDIATIONS.map(({ value, label: lbl }) => (
                        <option key={value} value={value}>{lbl}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Bucket Type</label>
                    <select value={rlBucketType} onChange={(e) => setRlBucketType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      {RATE_LIMIT_BUCKET_TYPES.map(({ value, label: lbl }) => (
                        <option key={value} value={value}>{lbl}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Notes</label>
                    <input type="text" value={rlNotes} onChange={(e) => setRlNotes(e.target.value)}
                      placeholder="Optional notes"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  </div>
                </div>
                <button
                  onClick={() => setRlMut.mutate()}
                  disabled={setRlMut.isPending}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
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
                      <RateLimitRow key={i} rl={rl} isProduction={isProduction} />
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
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No interdictions for this org.</p>
                ) : (
                  <div className="space-y-2">
                    {interdictions.map((int) => (
                      <div key={int.key}
                        className="rounded-lg border px-4 py-3 text-sm"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                        <p className="font-mono font-medium" style={{ color: 'var(--color-text)' }}>{int.key}</p>
                        {int.owners.length > 0 && (
                          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
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
                {isProduction && (
                  <div className="flex items-center gap-2 text-xs mb-4 px-3 py-2 rounded-md"
                    style={{ backgroundColor: 'rgba(245,158,11,0.10)', color: 'var(--color-warning, #f59e0b)' }}>
                    <AlertTriangle size={13} /> This will write to {env.toUpperCase()}.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Scope</label>
                    <input type="text" value={intScope} onChange={(e) => setIntScope(e.target.value)}
                      placeholder="e.g. org"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Op</label>
                    <input type="text" value={intOp} onChange={(e) => setIntOp(e.target.value)}
                      placeholder="e.g. all"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Sub-Org ID (optional)</label>
                    <input type="text" value={intSubOrgId} onChange={(e) => setIntSubOrgId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Action</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setIntBlocked(true); }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${intBlocked ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-transparent'}`}
                        style={{ color: intBlocked ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                      >
                        Block
                      </button>
                      <button
                        onClick={() => { setIntBlocked(false); }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${!intBlocked ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-transparent'}`}
                        style={{ color: !intBlocked ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                      >
                        Unblock
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIntMut.mutate()}
                  disabled={setIntMut.isPending}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                  style={{ backgroundColor: intBlocked ? 'var(--color-danger)' : 'var(--color-primary)', color: 'white' }}
                >
                  {setIntMut.isPending ? 'Applying…' : intBlocked ? 'Set Block' : 'Remove Block'}
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
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No quota overrides for this org.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                        <th className="text-left pb-2">Label</th>
                        <th className="text-right pb-2">Count</th>
                        <th className="text-right pb-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                      {quotas.map((q) => (
                        <tr key={q.label}>
                          <td className="py-2 font-mono" style={{ color: 'var(--color-text)' }}>{q.label}</td>
                          <td className="py-2 text-right font-mono" style={{ color: 'var(--color-text)' }}>{q.count}</td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => removeQuotaMut.mutate(q)}
                              disabled={removeQuotaMut.isPending}
                              className="p-1 rounded hover:bg-red-500/10 transition-colors disabled:opacity-40"
                              title={`Remove override${isProduction ? ' (LIVE)' : ''}`}
                            >
                              <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
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
                {isProduction && (
                  <div className="flex items-center gap-2 text-xs mb-4 px-3 py-2 rounded-md"
                    style={{ backgroundColor: 'rgba(245,158,11,0.10)', color: 'var(--color-warning, #f59e0b)' }}>
                    <AlertTriangle size={13} /> This will write to {env.toUpperCase()}.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Label</label>
                    <input type="text" value={quotaLabel} onChange={(e) => setQuotaLabel(e.target.value)}
                      placeholder="e.g. api_calls_per_month"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Count</label>
                    <input type="number" value={quotaCount} onChange={(e) => setQuotaCount(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  </div>
                </div>
                <button
                  onClick={() => setQuotaMut.mutate()}
                  disabled={setQuotaMut.isPending || !quotaLabel}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                >
                  <Plus size={14} />
                  {setQuotaMut.isPending ? 'Setting…' : 'Set Override'}
                </button>
              </Card>

              {/* Evaluate quota dry-run */}
              <Card>
                <SectionTitle>Evaluate Quota (Dry-run)</SectionTitle>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Runs a quota evaluation in dry-run mode — emits logs for troubleshooting without actually blocking or unblocking.
                </p>
                <div className="flex gap-3">
                  <input type="text" value={evalLabel} onChange={(e) => setEvalLabel(e.target.value)}
                    placeholder="Label, e.g. api_calls_per_month"
                    className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  <button
                    onClick={() => evalQuotaMut.mutate()}
                    disabled={evalQuotaMut.isPending || !evalLabel}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
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
                    <span style={{ color: status.refs.is_cached ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                      {status.refs.is_cached ? 'Yes — org refs are in Redis cache' : 'No — data will be pulled fresh from DB'}
                    </span>
                  }
                />
              </Card>

              <Card>
                <SectionTitle>Clear Cache for Org</SectionTitle>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Forces a cache eviction for this org, triggering a fresh pull of billing ID and product type from the database on the next request.
                </p>
                {isProduction && (
                  <div className="flex items-center gap-2 text-xs mb-4 px-3 py-2 rounded-md"
                    style={{ backgroundColor: 'rgba(245,158,11,0.10)', color: 'var(--color-warning, #f59e0b)' }}>
                    <AlertTriangle size={13} /> This will write to {env.toUpperCase()}.
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => clearCacheMut.mutate(false)}
                    disabled={clearCacheMut.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                  >
                    <RefreshCw size={14} />
                    {clearCacheMut.isPending ? 'Clearing…' : 'Clear Cache (org only)'}
                  </button>
                  <button
                    onClick={() => clearCacheMut.mutate(true)}
                    disabled={clearCacheMut.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-40"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                  >
                    <RefreshCw size={14} />
                    {clearCacheMut.isPending ? 'Clearing…' : 'Clear Cache (+ sub-orgs)'}
                  </button>
                </div>
              </Card>
            </Tabs.Content>
          </Tabs.Root>
        </>
      )}

      {/* Prompt when no org is loaded yet */}
      {!orgId && (
        <div className="py-12 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Enter an org UUID above to load its operations panel.
        </div>
      )}
    </div>
  );
}
