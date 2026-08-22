/**
 * EmailPage — Email / SES admin panel.
 *
 * Provides two areas:
 *   A) Email Suppression (primary): pageable table of suppressed addresses
 *      with add / lookup / delete controls.
 *   B) SES Domain + Email Verification: lookup/refresh/create panel.
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
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useEnvironment } from '@/lib/environment';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import {
  listSuppressedEmails,
  getSuppressedEmail,
  addSuppressedEmail,
  deleteSuppressedEmail,
  getSesDomain,
  refreshSesDomain,
  createSesDomain,
  getEmailVerification,
  updateEmailVerification,
} from '@/lib/api';
import type {
  SuppressedEmailSummary,
  GetSuppressedEmailResponse,
  SesDomainResponse,
  GetEmailVerificationResponse,
  SuppressionListReason,
} from '@/types';
import {
  SUPPRESSION_REASON_NAMES,
  SUPPRESSION_REASONS,
  VERIFICATION_STATUS_NAMES,
} from '@/types';

// ---------------------------------------------------------------------------
// Shared control styling (mirrors OrgOpsPage)
// ---------------------------------------------------------------------------

const FIELD =
  'w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const FIELD_MONO = `${FIELD} font-mono`;

const FIELD_LABEL = 'text-xs mb-1 block text-muted-foreground';

const PRIMARY_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40';

const TAB_TRIGGER =
  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:text-foreground';

const PAGE_SIZE = 25;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
      <span className="w-44 shrink-0 font-medium text-muted-foreground">
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

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  dangerous,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  dangerous?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="rounded-xl border border-border bg-card-background p-6 max-w-md w-full shadow-lg space-y-4">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-hover-overlay transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground transition-colors',
              dangerous
                ? 'bg-danger hover:opacity-90'
                : 'bg-primary hover:bg-primary-hover'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SES status badge
// ---------------------------------------------------------------------------

function VerBadge({ status }: { status: string }) {
  const label = VERIFICATION_STATUS_NAMES[status as keyof typeof VERIFICATION_STATUS_NAMES] ?? status;
  const ok = status === 'VERIFICATION_STATUS_SUCCESS';
  const pending = status === 'VERIFICATION_STATUS_PENDING';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        ok
          ? 'bg-success-soft text-success'
          : pending
            ? 'bg-warning-soft text-warning'
            : 'bg-danger-soft text-danger'
      )}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Suppression table row
// ---------------------------------------------------------------------------

function SuppressionRow({
  row,
  onDelete,
  isPending,
}: {
  row: SuppressedEmailSummary;
  onDelete: () => void;
  isPending: boolean;
}) {
  const reasonLabel =
    SUPPRESSION_REASON_NAMES[row.reason as keyof typeof SUPPRESSION_REASON_NAMES] ?? row.reason;
  const ts = row.last_update_time
    ? new Date(Number(row.last_update_time.seconds) * 1000).toISOString()
    : '—';
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-4 font-mono text-sm text-foreground break-all">
        {row.email_address}
      </td>
      <td className="py-2 pr-4 text-sm">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            row.reason === 'SUPPRESSION_LIST_REASON_BOUNCE'
              ? 'bg-warning-soft text-warning'
              : 'bg-danger-soft text-danger'
          )}
        >
          {reasonLabel}
        </span>
      </td>
      <td className="py-2 pr-4 text-xs text-muted-foreground font-mono">
        {ts}
      </td>
      <td className="py-2 text-right">
        <button
          onClick={onDelete}
          disabled={isPending}
          className="p-1 rounded text-danger transition-colors hover:bg-danger-soft disabled:opacity-40"
          title="Remove from suppression list"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EmailPage() {
  const { env, isProduction } = useEnvironment();
  const queryClient = useQueryClient();

  // ---- Suppression: pagination state ----
  const [tokenStack, setTokenStack] = useState<string[]>([]); // stack of previous page tokens
  const [currentToken, setCurrentToken] = useState<string | undefined>(
    undefined
  );

  // ---- Suppression: Add form state ----
  const [addEmail, setAddEmail] = useState('');
  const [addReason, setAddReason] = useState<SuppressionListReason>(
    'SUPPRESSION_LIST_REASON_BOUNCE'
  );

  // ---- Suppression: Lookup form state ----
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookedUp, setLookedUp] = useState('');

  // ---- Delete confirm dialog ----
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ---- SES Domain state ----
  const [sesDomain, setSesDomain] = useState('');
  const [sesDomainInput, setSesDomainInput] = useState('');
  const [showCreateSes, setShowCreateSes] = useState(false);
  const [createSesDomainInput, setCreateSesDomainInput] = useState('');
  const [confirmRefreshDomain, setConfirmRefreshDomain] = useState(false);

  // ---- Email Verification state ----
  const [verEmail, setVerEmail] = useState('');
  const [verEmailInput, setVerEmailInput] = useState('');
  const [confirmUpdateVer, setConfirmUpdateVer] = useState<{
    valid: boolean;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  // Suppression list (paginated)
  const {
    data: suppressionPage,
    isLoading: suppressionLoading,
    error: suppressionError,
  } = useQuery({
    queryKey: ['suppression-list', env, currentToken],
    queryFn: () =>
      listSuppressedEmails(env, {
        page_size: PAGE_SIZE,
        next_token: currentToken,
      }),
  });

  // Suppression lookup
  const {
    data: lookupResult,
    isLoading: lookupLoading,
    error: lookupError,
  } = useQuery<GetSuppressedEmailResponse>({
    queryKey: ['suppression-lookup', env, lookedUp],
    queryFn: () => getSuppressedEmail(lookedUp, env),
    enabled: !!lookedUp,
  });

  // SES Domain
  const {
    data: sesData,
    isLoading: sesLoading,
    error: sesError,
  } = useQuery<SesDomainResponse>({
    queryKey: ['ses-domain', env, sesDomain],
    queryFn: () => getSesDomain(sesDomain, env),
    enabled: !!sesDomain,
  });

  // Email Verification
  const {
    data: verData,
    isLoading: verLoading,
    error: verError,
  } = useQuery<GetEmailVerificationResponse>({
    queryKey: ['email-verification', env, verEmail],
    queryFn: () => getEmailVerification(verEmail, env),
    enabled: !!verEmail,
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const addMut = useMutation({
    mutationFn: () => addSuppressedEmail(env, addEmail.trim(), addReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppression-list', env] });
      toast({
        title: 'Email suppressed',
        description: addEmail.trim(),
      });
      setAddEmail('');
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: (email: string) => deleteSuppressedEmail(email, env),
    onSuccess: (_data, email) => {
      queryClient.invalidateQueries({ queryKey: ['suppression-list', env] });
      // If looking at the deleted address, clear the lookup
      if (lookedUp === email) setLookedUp('');
      toast({ title: 'Suppression removed', description: email });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const refreshSesMut = useMutation({
    mutationFn: () => refreshSesDomain(sesDomain, env),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ses-domain', env, sesDomain] });
      toast({ title: 'SES domain refreshed', description: sesDomain });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const createSesMut = useMutation({
    mutationFn: () =>
      createSesDomain(env, { domain: createSesDomainInput.trim() }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ses-domain', env] });
      setSesDomain(data.identity_name);
      setSesDomainInput(data.identity_name);
      setShowCreateSes(false);
      setCreateSesDomainInput('');
      toast({
        title: 'SES domain created',
        description: data.identity_name,
      });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateVerMut = useMutation({
    mutationFn: ({ valid }: { valid: boolean }) =>
      updateEmailVerification(env, verEmail, valid),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['email-verification', env, verEmail],
      });
      toast({
        title: 'Verification updated',
        description: `${data.email_address} → ${data.valid ? 'valid' : 'invalid'}`,
      });
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  // ---------------------------------------------------------------------------
  // Pagination helpers
  // ---------------------------------------------------------------------------

  function goNext() {
    if (!suppressionPage?.next_token) return;
    setTokenStack((prev) => [...prev, currentToken ?? '']);
    setCurrentToken(suppressionPage.next_token);
  }

  function goPrev() {
    if (tokenStack.length === 0) return;
    const newStack = [...tokenStack];
    const prev = newStack.pop();
    setTokenStack(newStack);
    setCurrentToken(prev === '' ? undefined : prev);
  }

  const items: SuppressedEmailSummary[] = suppressionPage?.items ?? [];
  const hasNext = !!suppressionPage?.next_token;
  const hasPrev = tokenStack.length > 0;
  const currentPage = tokenStack.length + 1;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Remove suppression?"
        description={`Remove ${confirmDelete} from the suppression list? SES will attempt to deliver to this address again.`}
        confirmLabel="Remove"
        dangerous
        onConfirm={() => {
          if (confirmDelete) deleteMut.mutate(confirmDelete);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmDialog
        open={confirmRefreshDomain}
        title="Refresh SES domain?"
        description={`This will delete and recreate the SES identity for "${sesDomain}", generating fresh DNS records. Existing verification will be reset.`}
        confirmLabel="Refresh"
        dangerous
        onConfirm={() => {
          setConfirmRefreshDomain(false);
          refreshSesMut.mutate();
        }}
        onCancel={() => setConfirmRefreshDomain(false)}
      />
      <ConfirmDialog
        open={confirmUpdateVer !== null}
        title="Update email verification?"
        description={`Mark ${verEmail} as ${confirmUpdateVer?.valid ? 'valid' : 'invalid'}? This overrides the cached verification result.`}
        confirmLabel={`Mark as ${confirmUpdateVer?.valid ? 'valid' : 'invalid'}`}
        dangerous={confirmUpdateVer?.valid === false}
        onConfirm={() => {
          if (confirmUpdateVer !== null) updateVerMut.mutate(confirmUpdateVer);
          setConfirmUpdateVer(null);
        }}
        onCancel={() => setConfirmUpdateVer(null)}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Email / SES</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Manage email suppression lists and SES domain / verification status.
        </p>
      </div>

      <ProdWarning env={env} />

      <Tabs.Root defaultValue="suppressions">
        <Tabs.List className="flex gap-1 border-b border-border mb-6">
          {[
            { value: 'suppressions', label: 'Suppressions' },
            { value: 'ses-domain', label: 'SES Domain' },
            { value: 'verification', label: 'Email Verification' },
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

        {/* ------------------------------------------------------------------ */}
        {/* Suppressions Tab                                                    */}
        {/* ------------------------------------------------------------------ */}
        <Tabs.Content value="suppressions" className="space-y-6">
          {/* Pageable table */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Suppressed Emails</SectionTitle>
              <span className="text-xs text-muted-foreground">
                Page {currentPage}
              </span>
            </div>

            {suppressionLoading && (
              <p className="text-sm animate-pulse text-muted-foreground py-4">
                Loading…
              </p>
            )}
            {suppressionError && (
              <p className="text-sm text-danger py-2">
                {(suppressionError as Error).message}
              </p>
            )}

            {!suppressionLoading && !suppressionError && (
              <>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No suppressed emails on this page.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                          <th className="text-left pb-2 pr-4">Email</th>
                          <th className="text-left pb-2 pr-4">Reason</th>
                          <th className="text-left pb-2 pr-4">Last Updated</th>
                          <th className="text-right pb-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((row) => (
                          <SuppressionRow
                            key={row.email_address}
                            row={row}
                            onDelete={() => setConfirmDelete(row.email_address)}
                            isPending={deleteMut.isPending}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination controls */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={goPrev}
                    disabled={!hasPrev}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-muted-foreground transition-colors hover:bg-hover-overlay disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    onClick={goNext}
                    disabled={!hasNext}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-muted-foreground transition-colors hover:bg-hover-overlay disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {items.length} item{items.length !== 1 ? 's' : ''} on this page
                  </span>
                </div>
              </>
            )}
          </Card>

          {/* Add suppression */}
          <Card>
            <SectionTitle>Add Suppression</SectionTitle>
            {isProduction && <WriteWarning env={env} />}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={FIELD_LABEL}>Email Address</label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="user@example.com"
                  className={FIELD_MONO}
                />
              </div>
              <div>
                <label className={FIELD_LABEL}>Reason</label>
                <select
                  value={addReason}
                  onChange={(e) =>
                    setAddReason(e.target.value as SuppressionListReason)
                  }
                  className={FIELD}
                >
                  {SUPPRESSION_REASONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => addMut.mutate()}
              disabled={addMut.isPending || !addEmail.trim()}
              className={cn(PRIMARY_BUTTON, 'mt-4')}
            >
              <Plus size={14} />
              {addMut.isPending ? 'Adding…' : 'Add Suppression'}
            </button>
          </Card>

          {/* Lookup one address */}
          <Card>
            <SectionTitle>Lookup Suppressed Address</SectionTitle>
            <div className="flex gap-3">
              <input
                type="email"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && lookupEmail.trim())
                    setLookedUp(lookupEmail.trim());
                }}
                placeholder="user@example.com"
                className={cn(FIELD_MONO, 'flex-1')}
              />
              <button
                onClick={() => {
                  if (lookupEmail.trim()) setLookedUp(lookupEmail.trim());
                }}
                className={PRIMARY_BUTTON}
              >
                <Search size={14} />
                Lookup
              </button>
            </div>

            {lookedUp && lookupLoading && (
              <p className="text-sm animate-pulse text-muted-foreground mt-4">
                Looking up…
              </p>
            )}
            {lookedUp && lookupError && (
              <p className="text-sm text-danger mt-4">
                {(lookupError as Error).message}
              </p>
            )}
            {lookedUp && lookupResult && (
              <div className="mt-4 space-y-0">
                <Field label="Email" value={lookupResult.email_address} />
                <Field
                  label="Reason"
                  value={
                    SUPPRESSION_REASON_NAMES[
                      lookupResult.reason as keyof typeof SUPPRESSION_REASON_NAMES
                    ] ?? lookupResult.reason
                  }
                />
                {lookupResult.last_update_time && (
                  <Field
                    label="Last Updated"
                    value={new Date(
                      Number(lookupResult.last_update_time.seconds) * 1000
                    ).toISOString()}
                  />
                )}
                {lookupResult.attributes?.feedback_id && (
                  <Field
                    label="Feedback ID"
                    value={lookupResult.attributes.feedback_id}
                  />
                )}
                {lookupResult.attributes?.message_id && (
                  <Field
                    label="Message ID"
                    value={lookupResult.attributes.message_id}
                  />
                )}
                <div className="pt-3">
                  {isProduction && <WriteWarning env={env} />}
                  <button
                    onClick={() => setConfirmDelete(lookupResult.email_address)}
                    disabled={deleteMut.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-danger text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                    Remove Suppression
                  </button>
                </div>
              </div>
            )}
          </Card>
        </Tabs.Content>

        {/* ------------------------------------------------------------------ */}
        {/* SES Domain Tab                                                      */}
        {/* ------------------------------------------------------------------ */}
        <Tabs.Content value="ses-domain" className="space-y-6">
          {/* Domain lookup */}
          <Card>
            <SectionTitle>SES Domain Lookup</SectionTitle>
            <div className="flex gap-3">
              <input
                type="text"
                value={sesDomainInput}
                onChange={(e) => setSesDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && sesDomainInput.trim())
                    setSesDomain(sesDomainInput.trim());
                }}
                placeholder="example.com"
                className={cn(FIELD_MONO, 'flex-1')}
              />
              <button
                onClick={() => {
                  if (sesDomainInput.trim())
                    setSesDomain(sesDomainInput.trim());
                }}
                className={PRIMARY_BUTTON}
              >
                <Search size={14} />
                Load Domain
              </button>
            </div>

            {sesDomain && sesLoading && (
              <p className="text-sm animate-pulse text-muted-foreground mt-4">
                Loading domain…
              </p>
            )}
            {sesDomain && sesError && (
              <p className="text-sm text-danger mt-4">
                {(sesError as Error).message}
              </p>
            )}
            {sesDomain && sesData && (
              <SesDomainPanel
                data={sesData}
                onRefresh={() => setConfirmRefreshDomain(true)}
                refreshPending={refreshSesMut.isPending}
                isProduction={isProduction}
              />
            )}
          </Card>

          {/* Create SES Domain (confirm-guarded) */}
          <Card>
            <SectionTitle>Create SES Domain</SectionTitle>
            <p className="text-sm text-muted-foreground mb-4">
              Provisions SES resources (Email Identity, Configuration Set,
              Tenant) for a new domain. Confirmation required.
            </p>
            {isProduction && <WriteWarning env={env} />}
            {!showCreateSes ? (
              <button
                onClick={() => setShowCreateSes(true)}
                className={PRIMARY_BUTTON}
              >
                <Plus size={14} />
                Create SES Domain…
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={FIELD_LABEL}>Domain</label>
                  <input
                    type="text"
                    value={createSesDomainInput}
                    onChange={(e) => setCreateSesDomainInput(e.target.value)}
                    placeholder="example.com"
                    className={FIELD_MONO}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => createSesMut.mutate()}
                    disabled={
                      createSesMut.isPending || !createSesDomainInput.trim()
                    }
                    className={cn(PRIMARY_BUTTON)}
                  >
                    <Plus size={14} />
                    {createSesMut.isPending ? 'Creating…' : 'Confirm Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateSes(false);
                      setCreateSesDomainInput('');
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-hover-overlay transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Card>
        </Tabs.Content>

        {/* ------------------------------------------------------------------ */}
        {/* Email Verification Tab                                              */}
        {/* ------------------------------------------------------------------ */}
        <Tabs.Content value="verification" className="space-y-6">
          <Card>
            <SectionTitle>Email Verification Lookup</SectionTitle>
            <div className="flex gap-3">
              <input
                type="email"
                value={verEmailInput}
                onChange={(e) => setVerEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && verEmailInput.trim())
                    setVerEmail(verEmailInput.trim());
                }}
                placeholder="user@example.com"
                className={cn(FIELD_MONO, 'flex-1')}
              />
              <button
                onClick={() => {
                  if (verEmailInput.trim()) setVerEmail(verEmailInput.trim());
                }}
                className={PRIMARY_BUTTON}
              >
                <Search size={14} />
                Lookup
              </button>
            </div>

            {verEmail && verLoading && (
              <p className="text-sm animate-pulse text-muted-foreground mt-4">
                Loading…
              </p>
            )}
            {verEmail && verError && (
              <p className="text-sm text-danger mt-4">
                {(verError as Error).message}
              </p>
            )}
            {verEmail && verData && (
              <div className="mt-4">
                <Field label="Email" value={verData.email_address} />
                <Field
                  label="Valid"
                  value={
                    verData.valid ? (
                      <span className="inline-flex items-center gap-1 text-success">
                        <CheckCircle size={14} /> Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-danger">
                        <XCircle size={14} /> Invalid
                      </span>
                    )
                  }
                />
                {verData.created_at && (
                  <Field
                    label="Created"
                    value={new Date(
                      Number(verData.created_at.seconds) * 1000
                    ).toISOString()}
                  />
                )}
                {verData.updated_at && (
                  <Field
                    label="Updated"
                    value={new Date(
                      Number(verData.updated_at.seconds) * 1000
                    ).toISOString()}
                  />
                )}

                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <SectionTitle>Update Verification Status</SectionTitle>
                  {isProduction && <WriteWarning env={env} />}
                  <p className="text-xs text-muted-foreground">
                    Override the cached validity — use with care.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmUpdateVer({ valid: true })}
                      disabled={updateVerMut.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-success-border text-success bg-success-soft hover:opacity-90 transition-colors disabled:opacity-40"
                    >
                      <CheckCircle size={14} /> Mark Valid
                    </button>
                    <button
                      onClick={() => setConfirmUpdateVer({ valid: false })}
                      disabled={updateVerMut.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-danger text-primary-foreground hover:opacity-90 transition-colors disabled:opacity-40"
                    >
                      <XCircle size={14} /> Mark Invalid
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SesDomainPanel sub-component
// ---------------------------------------------------------------------------

function SesDomainPanel({
  data,
  onRefresh,
  refreshPending,
  isProduction,
}: {
  data: SesDomainResponse;
  onRefresh: () => void;
  refreshPending: boolean;
  isProduction: boolean;
}) {
  return (
    <div className="mt-5 space-y-4">
      <div className="space-y-0">
        <Field label="Identity Name" value={data.identity_name} />
        <Field
          label="Config Set"
          value={data.configuration_set_name || '—'}
        />
        <Field
          label="Mail-From Domain"
          value={data.mail_from_domain || '—'}
        />
        <Field
          label="Tenants"
          value={
            data.tenant_names.length > 0
              ? data.tenant_names.join(', ')
              : '—'
          }
        />
        <Field
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
        />
        <Field
          label="Verification Status"
          value={<VerBadge status={data.verification_status} />}
        />
        <Field
          label="DKIM Status"
          value={<VerBadge status={data.dkim_status} />}
        />
        <Field
          label="Mail-From Status"
          value={<VerBadge status={data.mail_from_domain_status} />}
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
        <button
          onClick={onRefresh}
          disabled={refreshPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-warning-border text-warning bg-warning-soft hover:opacity-90 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={14} />
          {refreshPending ? 'Refreshing…' : 'Refresh SES Domain'}
        </button>
      </div>
    </div>
  );
}
