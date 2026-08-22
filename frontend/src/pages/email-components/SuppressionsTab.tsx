/**
 * SuppressionsTab — Pageable suppression list + add + lookup sub-panels.
 *
 * Owns all suppression-related state and hook calls for the Email page.
 */

import { useState } from 'react';
import {
  Search,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatProtoDate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { FieldDisplay } from '@/components/ui/field-display';
import { WriteWarning } from '@/components/ui/write-warning';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SuppressionRow } from './SuppressionRow';
import { useSuppressionList } from '@/hooks/email/useSuppressionList';
import { useSuppressionLookup } from '@/hooks/email/useSuppressionLookup';
import { useAddSuppression } from '@/hooks/email/useAddSuppression';
import { useDeleteSuppression } from '@/hooks/email/useDeleteSuppression';
import type { SuppressionListReason } from '@/types';
import { SUPPRESSION_REASON_NAMES, SUPPRESSION_REASONS } from '@/types';
import type { Environment } from '@/lib/environment';

interface SuppressionsTabProps {
  env: Environment;
  isProduction: boolean;
}

export function SuppressionsTab({ env, isProduction }: SuppressionsTabProps) {
  // Pagination
  const [tokenStack, setTokenStack] = useState<string[]>([]);
  const [currentToken, setCurrentToken] = useState<string | undefined>(undefined);

  // Add form
  const [addEmail, setAddEmail] = useState('');
  const [addReason, setAddReason] = useState<SuppressionListReason>(
    'SUPPRESSION_LIST_REASON_BOUNCE'
  );

  // Lookup form
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookedUp, setLookedUp] = useState('');

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Hooks
  const {
    data: suppressionPage,
    isLoading: suppressionLoading,
    error: suppressionError,
  } = useSuppressionList(env, currentToken);

  const {
    data: lookupResult,
    isLoading: lookupLoading,
    error: lookupError,
  } = useSuppressionLookup(env, lookedUp);

  const addMut = useAddSuppression({ env, onSuccess: () => setAddEmail('') });

  const deleteMut = useDeleteSuppression({
    env,
    onSuccess: (email) => { if (lookedUp === email) setLookedUp(''); },
  });

  // Pagination helpers
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

  const items = suppressionPage?.items ?? [];
  const hasNext = !!suppressionPage?.next_token;
  const hasPrev = tokenStack.length > 0;
  const currentPage = tokenStack.length + 1;

  return (
    <div className="space-y-6">
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

      {/* Pageable table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Suppressed Emails</SectionTitle>
          <span className="text-xs text-muted-foreground">Page {currentPage}</span>
        </div>
        {suppressionLoading && (
          <p className="text-sm animate-pulse text-muted-foreground py-4">Loading…</p>
        )}
        {suppressionError && (
          <p className="text-sm text-danger py-2">{(suppressionError as Error).message}</p>
        )}
        {!suppressionLoading && !suppressionError && (
          <>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No suppressed emails on this page.</p>
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
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={goPrev}
                disabled={!hasPrev}
              >
                <ChevronLeft size={14} /> Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={goNext}
                disabled={!hasNext}
              >
                Next <ChevronRight size={14} />
              </Button>
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
          <Field label="Email Address" htmlFor="add-suppression-email">
            <Input
              id="add-suppression-email"
              type="email"
              mono
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </Field>
          <Field label="Reason" htmlFor="add-suppression-reason">
            <Select
              id="add-suppression-reason"
              value={addReason}
              onChange={(e) => setAddReason(e.target.value as SuppressionListReason)}
              options={SUPPRESSION_REASONS}
            />
          </Field>
        </div>
        <Button
          onClick={() => addMut.mutate({ email: addEmail.trim(), reason: addReason })}
          disabled={addMut.isPending || !addEmail.trim()}
          className="mt-4"
        >
          <Plus size={14} />
          {addMut.isPending ? 'Adding…' : 'Add Suppression'}
        </Button>
      </Card>

      {/* Lookup one address */}
      <Card>
        <SectionTitle>Lookup Suppressed Address</SectionTitle>
        <div className="flex gap-3">
          <Input
            type="email"
            mono
            value={lookupEmail}
            onChange={(e) => setLookupEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && lookupEmail.trim())
                setLookedUp(lookupEmail.trim());
            }}
            placeholder="user@example.com"
            className="flex-1"
          />
          <Button
            onClick={() => { if (lookupEmail.trim()) setLookedUp(lookupEmail.trim()); }}
          >
            <Search size={14} />
            Lookup
          </Button>
        </div>
        {lookedUp && lookupLoading && (
          <p className="text-sm animate-pulse text-muted-foreground mt-4">Looking up…</p>
        )}
        {lookedUp && lookupError && (
          <p className="text-sm text-danger mt-4">{(lookupError as Error).message}</p>
        )}
        {lookedUp && lookupResult && (
          <div className="mt-4 space-y-0">
            <FieldDisplay label="Email" value={lookupResult.email_address} labelWidth="w-44" />
            <FieldDisplay
              label="Reason"
              value={
                SUPPRESSION_REASON_NAMES[
                  lookupResult.reason as keyof typeof SUPPRESSION_REASON_NAMES
                ] ?? lookupResult.reason
              }
              labelWidth="w-44"
            />
            {lookupResult.last_update_time && (
              <FieldDisplay
                label="Last Updated"
                value={formatProtoDate(lookupResult.last_update_time)}
                labelWidth="w-44"
              />
            )}
            {lookupResult.attributes?.feedback_id && (
              <FieldDisplay label="Feedback ID" value={lookupResult.attributes.feedback_id} labelWidth="w-44" />
            )}
            {lookupResult.attributes?.message_id && (
              <FieldDisplay label="Message ID" value={lookupResult.attributes.message_id} labelWidth="w-44" />
            )}
            <div className="pt-3">
              {isProduction && <WriteWarning env={env} />}
              <Button
                variant="danger"
                onClick={() => setConfirmDelete(lookupResult.email_address)}
                disabled={deleteMut.isPending}
              >
                <Trash2 size={14} />
                Remove Suppression
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
