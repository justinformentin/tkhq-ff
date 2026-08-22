/**
 * ServiceControlPage — engineering-only surface for scaling Kubernetes
 * deployments and redirecting service traffic via OperatorAgentService.
 *
 * ⚠️  DESTRUCTIVE OPERATIONS — requires service:admin RBAC.
 *
 * Both ScaleService and DirectService mutations are guarded by a two-step
 * confirmation gate:
 *   1. The user fills the form (operation type, service name, target params,
 *      environment).
 *   2. A modal appears showing the exact intended action. The user must type
 *      the service name verbatim to unlock the final "Execute" button.
 *
 * This prevents accidental fires from fat fingers or copy-paste errors.
 * The gate is separate for each operation (scale vs. direct) and resets on
 * every successful or dismissed action.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, ShieldAlert, X, TriangleAlert } from 'lucide-react';
import { useEnvironment } from '@/lib/environment';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { scaleService, directService } from '@/lib/api';
import type { ScaleServiceResponse, DirectServiceResponse } from '@/types';

// ---------------------------------------------------------------------------
// Shared styling (mirrors OrgOpsPage conventions)
// ---------------------------------------------------------------------------

const FIELD =
  'w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const FIELD_MONO = `${FIELD} font-mono`;

const FIELD_LABEL = 'text-xs mb-1 block text-muted-foreground';

const DANGER_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-danger text-white transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed';

const SECONDARY_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground transition-colors hover:bg-hover-overlay hover:text-foreground';

// ---------------------------------------------------------------------------
// Confirmation modal
// ---------------------------------------------------------------------------

interface ConfirmModalProps {
  title: string;
  description: string;
  /** Service name the user must type to confirm */
  serviceName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function ConfirmModal({
  title,
  description,
  serviceName,
  onConfirm,
  onCancel,
  isPending,
}: ConfirmModalProps) {
  const [typed, setTyped] = useState('');
  const confirmed = typed === serviceName;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-danger-border bg-background shadow-2xl p-6 mx-4">
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cancel"
        >
          <X size={18} />
        </button>

        {/* Icon + title */}
        <div className="flex items-start gap-3 mb-4">
          <span className="mt-0.5 shrink-0 rounded-full bg-danger-soft p-2">
            <ShieldAlert size={20} className="text-danger" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-sm mt-1 text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Type-to-confirm */}
        <div className="rounded-lg border border-warning-border bg-warning-soft px-4 py-3 text-sm text-warning mb-4">
          <div className="flex items-start gap-2">
            <TriangleAlert size={15} className="shrink-0 mt-0.5" />
            <span>
              This is a <strong>destructive, engineering-only</strong> operation.
              Type <span className="font-mono font-bold">{serviceName}</span> to
              confirm.
            </span>
          </div>
        </div>

        <label className={FIELD_LABEL}>
          Service name confirmation
        </label>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={serviceName}
          className={cn(FIELD_MONO, 'mb-4')}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && confirmed && !isPending) onConfirm();
            if (e.key === 'Escape') onCancel();
          }}
        />

        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className={SECONDARY_BUTTON}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || isPending}
            className={DANGER_BUTTON}
          >
            {isPending ? 'Executing…' : 'Execute'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result card shown after a successful action
// ---------------------------------------------------------------------------

function ResultCard({
  label,
  result,
  onDismiss,
}: {
  label: string;
  result: ScaleServiceResponse | DirectServiceResponse;
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-lg border border-success-border bg-success-soft px-4 py-3 text-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-success">{label} — succeeded</span>
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Environment options for the proto enum
// (must match what the operator agent accepts — conservative list)
// ---------------------------------------------------------------------------

const ENVIRONMENT_OPTIONS = [
  { value: '', label: '— select environment —' },
  { value: 'ENVIRONMENT_DEVELOPMENT', label: 'Development' },
  { value: 'ENVIRONMENT_STAGING', label: 'Staging' },
  { value: 'ENVIRONMENT_PREPROD', label: 'Pre-production' },
  { value: 'ENVIRONMENT_PRODUCTION', label: 'Production' },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ServiceControlPage() {
  const { env } = useEnvironment();

  // ---- ScaleService form state ----
  const [scaleService_name, setScaleServiceName] = useState('');
  const [scaleReplicas, setScaleReplicas] = useState('1');
  const [scaleEnvironment, setScaleEnvironment] = useState('');
  const [scaleConfirmOpen, setScaleConfirmOpen] = useState(false);
  const [scaleResult, setScaleResult] = useState<ScaleServiceResponse | null>(
    null
  );

  // ---- DirectService form state ----
  const [directService_name, setDirectServiceName] = useState('');
  const [directDirection, setDirectDirection] = useState('');
  const [directEnvironment, setDirectEnvironment] = useState('');
  const [directConfirmOpen, setDirectConfirmOpen] = useState(false);
  const [directResult, setDirectResult] =
    useState<DirectServiceResponse | null>(null);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const scaleMut = useMutation({
    mutationFn: () =>
      scaleService(scaleService_name, env, {
        replicas: Number(scaleReplicas),
        environment: scaleEnvironment,
      }),
    onSuccess: (data) => {
      setScaleConfirmOpen(false);
      setScaleResult(data);
      toast({
        title: 'ScaleService succeeded',
        description: `${data.service} → ${data.replicas} replica(s) in ${data.environment}`,
      });
    },
    onError: (e: Error) => {
      setScaleConfirmOpen(false);
      toast({
        title: 'ScaleService failed',
        description: e.message,
        variant: 'destructive',
      });
    },
  });

  const directMut = useMutation({
    mutationFn: () =>
      directService(directService_name, env, {
        direction: directDirection,
        environment: directEnvironment,
      }),
    onSuccess: (data) => {
      setDirectConfirmOpen(false);
      setDirectResult(data);
      toast({
        title: 'DirectService succeeded',
        description: `${data.service} → ${data.direction} in ${data.environment}`,
      });
    },
    onError: (e: Error) => {
      setDirectConfirmOpen(false);
      toast({
        title: 'DirectService failed',
        description: e.message,
        variant: 'destructive',
      });
    },
  });

  // ---------------------------------------------------------------------------
  // Validation helpers
  // ---------------------------------------------------------------------------

  const scaleValid =
    scaleService_name.trim() !== '' &&
    scaleEnvironment !== '' &&
    Number(scaleReplicas) >= 0 &&
    !isNaN(Number(scaleReplicas));

  const directValid =
    directService_name.trim() !== '' &&
    directDirection.trim() !== '' &&
    directEnvironment !== '';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-8 max-w-3xl space-y-8">
      {/* ------------------------------------------------------------------ */}
      {/* Page header — emphasize destructive nature                           */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="rounded-lg bg-danger-soft p-2">
            <ShieldAlert size={22} className="text-danger" />
          </span>
          <h1 className="text-2xl font-bold text-foreground">
            Service Control
          </h1>
          <span className="ml-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-danger-soft text-danger border border-danger-border">
            Engineering Only
          </span>
        </div>
        <p className="text-sm text-muted-foreground max-w-xl">
          Scale Kubernetes deployments and redirect service traffic via
          OperatorAgentService. These operations are{' '}
          <strong className="text-danger">
            destructive and affect live infrastructure
          </strong>
          . All mutations require explicit confirmation — type the service name
          to proceed.
        </p>
      </div>

      {/* Global warning banner */}
      <div className="flex items-start gap-3 rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Engineering-only surface</p>
          <p className="mt-0.5 text-xs opacity-80">
            Requires <code className="font-mono">service:admin</code> RBAC on
            the operator agent. Misconfigured replica counts or wrong traffic
            direction can cause customer-facing outages. Double-check the
            service name and environment before confirming.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ScaleService card                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="rounded-lg border border-border bg-card-background p-6 space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">ScaleService</h2>
            <span className="text-xs text-muted-foreground font-mono">(W)</span>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Adjust the replica count of a Kubernetes deployment. Scaling to 0
            brings the service down.
          </p>

          {/* Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={FIELD_LABEL}>
                Service name{' '}
                <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={scaleService_name}
                onChange={(e) => setScaleServiceName(e.target.value)}
                placeholder="e.g. api-server"
                className={FIELD_MONO}
              />
            </div>

            <div>
              <label className={FIELD_LABEL}>
                Target replicas{' '}
                <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                value={scaleReplicas}
                onChange={(e) => setScaleReplicas(e.target.value)}
                min={0}
                step={1}
                className={FIELD}
              />
            </div>

            <div>
              <label className={FIELD_LABEL}>
                Environment{' '}
                <span className="text-danger">*</span>
              </label>
              <select
                value={scaleEnvironment}
                onChange={(e) => setScaleEnvironment(e.target.value)}
                className={FIELD}
              >
                {ENVIRONMENT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value} disabled={value === ''}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Intent preview */}
          {scaleValid && (
            <div className="rounded-md border border-border bg-background px-4 py-3 text-xs font-mono text-muted-foreground">
              <span className="text-warning font-semibold">Intent: </span>
              ScaleService({' '}
              <span className="text-foreground">{scaleService_name}</span>,
              replicas=
              <span className="text-foreground">{scaleReplicas}</span>,
              environment=
              <span className="text-foreground">{scaleEnvironment}</span> )
            </div>
          )}

          <button
            onClick={() => setScaleConfirmOpen(true)}
            disabled={!scaleValid || scaleMut.isPending}
            className={cn(DANGER_BUTTON)}
          >
            <ShieldAlert size={14} />
            {scaleMut.isPending ? 'Executing…' : 'Scale Service…'}
          </button>
        </div>

        {/* Result */}
        {scaleResult && (
          <div className="mt-3">
            <ResultCard
              label="ScaleService"
              result={scaleResult}
              onDismiss={() => setScaleResult(null)}
            />
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* DirectService card                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="rounded-lg border border-border bg-card-background p-6 space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">DirectService</h2>
            <span className="text-xs text-muted-foreground font-mono">(W)</span>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Redirect traffic for a Kubernetes service to a named target (e.g.
            canary → stable rollback or canary promotion).
          </p>

          {/* Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={FIELD_LABEL}>
                Service name{' '}
                <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={directService_name}
                onChange={(e) => setDirectServiceName(e.target.value)}
                placeholder="e.g. api-server"
                className={FIELD_MONO}
              />
            </div>

            <div>
              <label className={FIELD_LABEL}>
                Direction / target{' '}
                <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={directDirection}
                onChange={(e) => setDirectDirection(e.target.value)}
                placeholder="e.g. canary, stable, rollback"
                className={FIELD_MONO}
              />
            </div>

            <div>
              <label className={FIELD_LABEL}>
                Environment{' '}
                <span className="text-danger">*</span>
              </label>
              <select
                value={directEnvironment}
                onChange={(e) => setDirectEnvironment(e.target.value)}
                className={FIELD}
              >
                {ENVIRONMENT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value} disabled={value === ''}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Intent preview */}
          {directValid && (
            <div className="rounded-md border border-border bg-background px-4 py-3 text-xs font-mono text-muted-foreground">
              <span className="text-warning font-semibold">Intent: </span>
              DirectService({' '}
              <span className="text-foreground">{directService_name}</span>,
              direction=
              <span className="text-foreground">{directDirection}</span>,
              environment=
              <span className="text-foreground">{directEnvironment}</span> )
            </div>
          )}

          <button
            onClick={() => setDirectConfirmOpen(true)}
            disabled={!directValid || directMut.isPending}
            className={cn(DANGER_BUTTON)}
          >
            <ShieldAlert size={14} />
            {directMut.isPending ? 'Executing…' : 'Direct Service…'}
          </button>
        </div>

        {/* Result */}
        {directResult && (
          <div className="mt-3">
            <ResultCard
              label="DirectService"
              result={directResult}
              onDismiss={() => setDirectResult(null)}
            />
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Confirmation modals (rendered at root level to escape card stacking) */}
      {/* ------------------------------------------------------------------ */}

      {scaleConfirmOpen && (
        <ConfirmModal
          title="Confirm: ScaleService"
          description={`Scale "${scaleService_name}" to ${scaleReplicas} replica(s) in ${scaleEnvironment}.`}
          serviceName={scaleService_name}
          onConfirm={() => scaleMut.mutate()}
          onCancel={() => setScaleConfirmOpen(false)}
          isPending={scaleMut.isPending}
        />
      )}

      {directConfirmOpen && (
        <ConfirmModal
          title="Confirm: DirectService"
          description={`Direct traffic for "${directService_name}" → "${directDirection}" in ${directEnvironment}.`}
          serviceName={directService_name}
          onConfirm={() => directMut.mutate()}
          onCancel={() => setDirectConfirmOpen(false)}
          isPending={directMut.isPending}
        />
      )}
    </div>
  );
}
