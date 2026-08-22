/**
 * VerificationTab — Email verification lookup and override sub-panel.
 */

import { useState } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { formatProtoDate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { FieldDisplay } from '@/components/ui/field-display';
import { WriteWarning } from '@/components/ui/write-warning';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useEmailVerificationQuery,
  useUpdateEmailVerification,
} from '@/hooks/email/useEmailVerification';
import type { Environment } from '@/lib/environment';

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
          <Input
            type="email"
            mono
            value={verEmailInput}
            onChange={(e) => setVerEmailInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && verEmailInput.trim())
                setVerEmail(verEmailInput.trim());
            }}
            placeholder="user@example.com"
            className="flex-1"
          />
          <Button
            onClick={() => { if (verEmailInput.trim()) setVerEmail(verEmailInput.trim()); }}
          >
            <Search size={14} />
            Lookup
          </Button>
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
                <Button
                  variant="success-soft"
                  onClick={() => setConfirmUpdateVer({ valid: true })}
                  disabled={updateVerMut.isPending}
                >
                  <CheckCircle size={14} /> Mark Valid
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setConfirmUpdateVer({ valid: false })}
                  disabled={updateVerMut.isPending}
                >
                  <XCircle size={14} /> Mark Invalid
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
