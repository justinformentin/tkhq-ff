/**
 * VerificationTab — Email verification lookup and override sub-panel.
 */

import { useState } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatProtoDate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { FieldDisplay } from '@/components/ui/field-display';
import { WriteWarning } from '@/components/ui/write-warning';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  useEmailVerificationQuery,
  useUpdateEmailVerification,
} from '@/hooks/email/useEmailVerification';
import type { Environment } from '@/lib/environment';

const FIELD =
  'w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const FIELD_MONO = `${FIELD} font-mono`;
const PRIMARY_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40';

interface VerificationTabProps {
  env: Environment;
  isProduction: boolean;
}

export function VerificationTab({ env, isProduction }: VerificationTabProps) {
  const [verEmail, setVerEmail] = useState('');
  const [verEmailInput, setVerEmailInput] = useState('');
  const [confirmUpdateVer, setConfirmUpdateVer] = useState<{ valid: boolean } | null>(null);

  const { data: verData, isLoading: verLoading, error: verError } =
    useEmailVerificationQuery(env, verEmail);

  const updateVerMut = useUpdateEmailVerification(env, verEmail);

  return (
    <div className="space-y-6">
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
            onClick={() => { if (verEmailInput.trim()) setVerEmail(verEmailInput.trim()); }}
            className={PRIMARY_BUTTON}
          >
            <Search size={14} />
            Lookup
          </button>
        </div>

        {verEmail && verLoading && (
          <p className="text-sm animate-pulse text-muted-foreground mt-4">Loading…</p>
        )}
        {verEmail && verError && (
          <p className="text-sm text-danger mt-4">{(verError as Error).message}</p>
        )}
        {verEmail && verData && (
          <div className="mt-4">
            <FieldDisplay label="Email" value={verData.email_address} labelWidth="w-44" />
            <FieldDisplay
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
              labelWidth="w-44"
            />
            {verData.created_at && (
              <FieldDisplay label="Created" value={formatProtoDate(verData.created_at)} labelWidth="w-44" />
            )}
            {verData.updated_at && (
              <FieldDisplay label="Updated" value={formatProtoDate(verData.updated_at)} labelWidth="w-44" />
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
    </div>
  );
}
