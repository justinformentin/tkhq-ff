import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSuppressedEmails,
  getSuppressedEmail,
  addSuppressedEmail,
  deleteSuppressedEmail,
} from '@/lib/api';
import { useEnvironment } from '@/lib/environment';
import { useToast } from '@/hooks/useToast';
import type { SuppressedEmail } from '@/types';
import { Plus, Trash2, ChevronRight, X, Mail } from 'lucide-react';

export const Route = createFileRoute('/email/')({
  component: EmailSuppressionRouteComponent,
});

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const HEADER_CELL =
  'text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground';

function formatTimestamp(ts?: { seconds: string; nanos: number }): string {
  if (!ts) return '—';
  const ms = Number(ts.seconds) * 1000;
  if (isNaN(ms)) return '—';
  return new Date(ms).toLocaleString();
}

// ---------------------------------------------------------------------------
// Add Suppression Modal
// ---------------------------------------------------------------------------

function AddSuppressionModal({
  onClose,
  onAdd,
  isPending,
}: {
  onClose: () => void;
  onAdd: (email: string) => void;
  isPending: boolean;
}) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (trimmed) onAdd(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border bg-card-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Add to suppression list
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email address
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-hover-overlay transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !email.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {isPending ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Remove Confirm Dialog
// ---------------------------------------------------------------------------

function RemoveConfirmDialog({
  email,
  onClose,
  onConfirm,
  isPending,
}: {
  email: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card-background p-6 shadow-xl">
        <h2 className="text-base font-semibold text-foreground mb-2">
          Remove from suppression list?
        </h2>
        <p className="text-sm text-muted-foreground mb-4 break-all">
          <span className="font-mono">{email}</span> will be removed and may
          receive email again.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-hover-overlay transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-danger text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {isPending ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lookup Panel
// ---------------------------------------------------------------------------

function LookupPanel({ env }: { env: string }) {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data, isFetching, error } = useQuery({
    queryKey: ['email-suppressed-lookup', env, submitted],
    queryFn: () => getSuppressedEmail(submitted, env as never),
    enabled: submitted.length > 0,
    retry: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) setSubmitted(trimmed);
  };

  const handleClear = () => {
    setQuery('');
    setSubmitted('');
  };

  return (
    <div className="rounded-lg border border-border bg-card-background p-4">
      <h2 className="text-sm font-semibold text-foreground mb-3">
        Look up single address
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="user@example.com"
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!query.trim() || isFetching}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {isFetching ? '…' : 'Look up'}
        </button>
        {submitted && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </form>

      {error && (
        <div className="mt-3 rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {(error as Error).message}
        </div>
      )}

      {data?.suppressed_email && (
        <div className="mt-3 rounded-lg border border-border p-3 text-sm space-y-1">
          <div className="font-medium text-foreground break-all">
            {data.suppressed_email.email_address}
          </div>
          {data.suppressed_email.reason && (
            <div className="text-muted-foreground">
              Reason: {data.suppressed_email.reason}
            </div>
          )}
          {data.suppressed_email.source && (
            <div className="text-muted-foreground">
              Source: {data.suppressed_email.source}
            </div>
          )}
          <div className="text-muted-foreground">
            Suppressed: {formatTimestamp(data.suppressed_email.created_at)}
          </div>
        </div>
      )}

      {submitted && !error && !data?.suppressed_email && !isFetching && (
        <div className="mt-3 text-sm text-muted-foreground">
          No suppression record found for{' '}
          <span className="font-mono">{submitted}</span>.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function EmailSuppressionRouteComponent() {
  const { env } = useEnvironment();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [pageHistory, setPageHistory] = useState<string[]>([]); // stack of previous tokens
  const [pageSize, setPageSize] = useState(25);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['email-suppressed', env, pageToken, pageSize],
    queryFn: () => listSuppressedEmails(env, pageToken, pageSize),
  });

  const addMutation = useMutation({
    mutationFn: (emailAddress: string) => addSuppressedEmail(emailAddress, env),
    onSuccess: (result) => {
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ['email-suppressed', env] });
      toast({
        title: 'Added',
        description: `${result.suppressed_email?.email_address ?? 'Email'} added to suppression list.`,
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (emailAddress: string) => deleteSuppressedEmail(emailAddress, env),
    onSuccess: () => {
      setRemoveTarget(null);
      queryClient.invalidateQueries({ queryKey: ['email-suppressed', env] });
      toast({ title: 'Removed', description: 'Email removed from suppression list.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const emails: SuppressedEmail[] = data?.suppressed_emails ?? [];
  const nextPageToken = data?.next_page_token;

  const handleNextPage = () => {
    if (!nextPageToken) return;
    setPageHistory((prev) => [...prev, pageToken ?? '']);
    setPageToken(nextPageToken);
  };

  const handlePrevPage = () => {
    const history = [...pageHistory];
    const prev = history.pop();
    setPageHistory(history);
    setPageToken(prev === '' ? undefined : prev);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Email Suppression
          </h1>
          <p className="text-sm mt-0.5 text-muted-foreground">
            Manage suppressed email addresses — suppressed addresses will not
            receive transactional email.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/email/ses"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-hover-overlay transition-colors"
          >
            SES Domains
            <ChevronRight size={14} />
          </Link>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            Add suppressed email
          </button>
        </div>
      </div>

      {/* Lookup panel */}
      <LookupPanel env={env} />

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          Failed to load suppressed emails: {(error as Error).message}
        </div>
      )}

      {/* Table controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Page size:</span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => {
                setPageSize(size);
                setPageToken(undefined);
                setPageHistory([]);
              }}
              className={[
                'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                pageSize === size
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:bg-hover-overlay',
              ].join(' ')}
            >
              {size}
            </button>
          ))}
        </div>
        {!isLoading && (
          <span className="text-sm text-muted-foreground">
            {emails.length} shown
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-card-background">
              <th className={HEADER_CELL}>Email address</th>
              <th className={HEADER_CELL}>Reason / source</th>
              <th className={HEADER_CELL}>Suppressed at</th>
              <th className="w-16 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: pageSize > 10 ? 8 : 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-4 rounded w-48 bg-elevated-background" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 rounded w-24 bg-elevated-background" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 rounded w-32 bg-elevated-background" />
                    </td>
                    <td />
                  </tr>
                ))
              : emails.map((email) => (
                  <tr
                    key={email.email_address}
                    className="border-t border-border hover:bg-card-background-hover transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="shrink-0 text-muted-foreground" />
                        <span className="font-mono text-sm text-foreground break-all">
                          {email.email_address}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {email.reason || email.source
                        ? [email.reason, email.source]
                            .filter(Boolean)
                            .join(' / ')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatTimestamp(email.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setRemoveTarget(email.email_address)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-danger hover:bg-danger-soft transition-colors"
                        aria-label={`Remove ${email.email_address}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!isLoading && emails.length === 0 && !error && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No suppressed emails on this page
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={pageHistory.length === 0}
          className="px-4 py-2 rounded-lg border border-border text-sm text-foreground disabled:opacity-40 hover:bg-hover-overlay transition-colors"
        >
          Previous
        </button>
        <span className="text-sm text-muted-foreground">
          Page {pageHistory.length + 1}
        </span>
        <button
          type="button"
          onClick={handleNextPage}
          disabled={!nextPageToken}
          className="px-4 py-2 rounded-lg border border-border text-sm text-foreground disabled:opacity-40 hover:bg-hover-overlay transition-colors"
        >
          Next
        </button>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddSuppressionModal
          onClose={() => setShowAddModal(false)}
          onAdd={(email) => addMutation.mutate(email)}
          isPending={addMutation.isPending}
        />
      )}

      {removeTarget && (
        <RemoveConfirmDialog
          email={removeTarget}
          onClose={() => setRemoveTarget(null)}
          onConfirm={() => removeMutation.mutate(removeTarget)}
          isPending={removeMutation.isPending}
        />
      )}
    </div>
  );
}
