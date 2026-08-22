import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getSesDomain,
  createSesDomain,
  refreshSesDomain,
  createCustomDomainEntry,
  updateAuthProxyEmailConfig,
  getEmailVerification,
  updateEmailVerification,
} from '@/lib/api';
import { useEnvironment } from '@/lib/environment';
import { useToast } from '@/hooks/useToast';
import { ArrowLeft, RefreshCw, Plus, CheckCircle2, XCircle } from 'lucide-react';

export const Route = createFileRoute('/email/ses')({
  component: SesDomainsRouteComponent,
});

function formatTimestamp(ts?: { seconds: string; nanos: number }): string {
  if (!ts) return '—';
  const ms = Number(ts.seconds) * 1000;
  if (isNaN(ms)) return '—';
  return new Date(ms).toLocaleString();
}

// ---------------------------------------------------------------------------
// Section card shell
// ---------------------------------------------------------------------------

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card-background p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm mt-0.5 text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field row helper
// ---------------------------------------------------------------------------

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-foreground break-all">{value ?? '—'}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SES Domain Inspector
// ---------------------------------------------------------------------------

function SesDomainSection({ env }: { env: string }) {
  const { toast } = useToast();
  const [domainInput, setDomainInput] = useState('');
  const [lookedUp, setLookedUp] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newMailFrom, setNewMailFrom] = useState('');

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['ses-domain', env, lookedUp],
    queryFn: () => getSesDomain(lookedUp, env as never),
    enabled: lookedUp.length > 0,
    retry: false,
  });

  const refreshMutation = useMutation({
    mutationFn: (domain: string) => refreshSesDomain(domain, env as never),
    onSuccess: (result) => {
      toast({
        title: 'Refreshed',
        description: `${result.ses_domain?.domain} DNS status updated.`,
      });
      void refetch();
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createSesDomain(env as never, newDomain.trim(), newMailFrom.trim() || undefined),
    onSuccess: (result) => {
      toast({ title: 'Domain created', description: result.ses_domain?.domain });
      setShowCreateForm(false);
      setNewDomain('');
      setNewMailFrom('');
      setLookedUp(result.ses_domain?.domain ?? '');
      setDomainInput(result.ses_domain?.domain ?? '');
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const domain = data?.ses_domain;

  return (
    <Section
      title="SES Domain Inspector"
      description="Look up a domain in SES, create a new one, or refresh its DNS status."
    >
      {/* Lookup form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setLookedUp(domainInput.trim());
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          placeholder="example.com"
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!domainInput.trim() || isFetching}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {isFetching ? '…' : 'Look up'}
        </button>
        <button
          type="button"
          onClick={() => setShowCreateForm((s) => !s)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-hover-overlay transition-colors"
        >
          <Plus size={14} />
          Create
        </button>
      </form>

      {/* Create form */}
      {showCreateForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="rounded-lg border border-border p-4 space-y-3"
        >
          <h3 className="text-sm font-medium text-foreground">Create new SES domain</h3>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Domain
            </label>
            <input
              type="text"
              required
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="mail.example.com"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Mail-from domain (optional)
            </label>
            <input
              type="text"
              value={newMailFrom}
              onChange={(e) => setNewMailFrom(e.target.value)}
              placeholder="bounce.example.com"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-hover-overlay transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newDomain.trim() || createMutation.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {createMutation.isPending ? 'Creating…' : 'Create domain'}
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {(error as Error).message}
        </div>
      )}

      {/* Result */}
      {domain && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">{domain.domain}</span>
            <button
              type="button"
              onClick={() => refreshMutation.mutate(domain.domain)}
              disabled={refreshMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:bg-hover-overlay disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={12} className={refreshMutation.isPending ? 'animate-spin' : ''} />
              Refresh DNS
            </button>
          </div>
          <div className="space-y-2">
            <Field label="Status" value={domain.status} />
            <Field
              label="Mail-from"
              value={domain.mail_from_domain}
            />
            <Field
              label="DKIM tokens"
              value={
                domain.dkim_tokens?.length
                  ? domain.dkim_tokens.map((t) => (
                      <span
                        key={t}
                        className="block font-mono text-xs break-all"
                      >
                        {t}
                      </span>
                    ))
                  : undefined
              }
            />
            <Field label="Created" value={formatTimestamp(domain.created_at)} />
            <Field label="Updated" value={formatTimestamp(domain.updated_at)} />
          </div>
        </div>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Email Verification Section
// ---------------------------------------------------------------------------

function EmailVerificationSection({ env }: { env: string }) {
  const { toast } = useToast();
  const [emailInput, setEmailInput] = useState('');
  const [lookedUp, setLookedUp] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['email-verification', env, lookedUp],
    queryFn: () => getEmailVerification(lookedUp, env as never),
    enabled: lookedUp.length > 0,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateEmailVerification(lookedUp, env as never, newStatus.trim() || undefined),
    onSuccess: () => {
      toast({ title: 'Verification updated' });
      setNewStatus('');
      void refetch();
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const verification = data?.email_verification;

  return (
    <Section
      title="Email Verification"
      description="Look up or update the verification status for an email address."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setLookedUp(emailInput.trim());
        }}
        className="flex gap-2"
      >
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="user@example.com"
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!emailInput.trim() || isFetching}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {isFetching ? '…' : 'Look up'}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {(error as Error).message}
        </div>
      )}

      {verification && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            {verification.status === 'Success' || verification.status === 'VERIFIED' ? (
              <CheckCircle2 size={16} className="text-success shrink-0" />
            ) : (
              <XCircle size={16} className="text-muted-foreground shrink-0" />
            )}
            <span className="font-medium text-foreground break-all">
              {verification.email_address}
            </span>
          </div>
          <div className="space-y-2">
            <Field label="Status" value={verification.status} />
            <Field label="Verified at" value={formatTimestamp(verification.verified_at)} />
            <Field label="Updated" value={formatTimestamp(verification.updated_at)} />
          </div>

          {/* Update form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate();
            }}
            className="flex gap-2 pt-2 border-t border-border"
          >
            <input
              type="text"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="New status (leave blank to clear)"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {updateMutation.isPending ? 'Saving…' : 'Update'}
            </button>
          </form>
        </div>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Auth Proxy Config Section
// ---------------------------------------------------------------------------

function AuthProxyConfigSection({ env }: { env: string }) {
  const { toast } = useToast();
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [replyTo, setReplyTo] = useState('');

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAuthProxyEmailConfig(env as never, {
        from_email: fromEmail.trim() || undefined,
        from_name: fromName.trim() || undefined,
        reply_to_email: replyTo.trim() || undefined,
      }),
    onSuccess: () => {
      toast({ title: 'Auth proxy config updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  return (
    <Section
      title="Auth Proxy Email Config"
      description="Set the sender name, from address, and reply-to for auth-proxy emails."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateMutation.mutate();
        }}
        className="space-y-3"
      >
        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted-foreground">
            From email
          </label>
          <input
            type="email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="no-reply@example.com"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted-foreground">
            From name
          </label>
          <input
            type="text"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="Acme Inc"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted-foreground">
            Reply-to email
          </label>
          <input
            type="email"
            value={replyTo}
            onChange={(e) => setReplyTo(e.target.value)}
            placeholder="support@example.com"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save config'}
          </button>
        </div>
      </form>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Custom Domain Entry Section
// ---------------------------------------------------------------------------

function CustomDomainSection({ env }: { env: string }) {
  const { toast } = useToast();
  const [domain, setDomain] = useState('');
  const [orgId, setOrgId] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      createCustomDomainEntry(env as never, domain.trim(), orgId.trim() || undefined),
    onSuccess: (result) => {
      toast({
        title: 'Custom domain created',
        description: result.domain,
      });
      setDomain('');
      setOrgId('');
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  return (
    <Section
      title="Custom Domain Entry"
      description="Register a custom email domain, optionally scoped to an org."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="space-y-3"
      >
        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted-foreground">
            Domain
          </label>
          <input
            type="text"
            required
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="mail.example.com"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted-foreground">
            Org ID (optional)
          </label>
          <input
            type="text"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            placeholder="org-…"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!domain.trim() || createMutation.isPending}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {createMutation.isPending ? 'Creating…' : 'Create entry'}
          </button>
        </div>
      </form>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function SesDomainsRouteComponent() {
  const { env } = useEnvironment();

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/email"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Back to Email Suppression
        </Link>
        <h1 className="text-2xl font-bold text-foreground">SES Domains</h1>
        <p className="text-sm mt-0.5 text-muted-foreground">
          Inspect and manage SES domains, email verification, custom domains, and
          auth proxy email configuration.
        </p>
      </div>

      <SesDomainSection env={env} />
      <EmailVerificationSection env={env} />
      <AuthProxyConfigSection env={env} />
      <CustomDomainSection env={env} />
    </div>
  );
}
