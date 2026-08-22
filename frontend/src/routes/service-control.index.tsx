// Engineering-only page — requires service:admin role

import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, ServerCrash, Shuffle } from 'lucide-react';
import { useEnvironment } from '@/lib/environment';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { scaleService, directService } from '@/lib/api';

export const Route = createFileRoute('/service-control/')({
  component: ServiceControlRouteComponent,
});

// ---------------------------------------------------------------------------
// Shared styling constants (mirrors OrgOpsPage conventions)
// ---------------------------------------------------------------------------

const FIELD =
  'w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const FIELD_LABEL = 'text-xs mb-1 block text-muted-foreground';

const DANGER_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-danger text-white transition-colors hover:opacity-90 disabled:opacity-40';

const ENVIRONMENTS = ['dev', 'preprod', 'prod', 'admin'] as const;
type ServiceEnvironment = (typeof ENVIRONMENTS)[number];

// ---------------------------------------------------------------------------
// Confirmation modal
// ---------------------------------------------------------------------------

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div className="relative z-10 mx-4 w-full max-w-md rounded-xl border border-border bg-card-background p-6 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle
            size={20}
            className="shrink-0 text-danger mt-0.5"
          />
          <div>
            <h2 className="font-semibold text-foreground text-base">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground transition-colors hover:bg-hover-overlay hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={DANGER_BUTTON}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card wrapper
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

// ---------------------------------------------------------------------------
// Scale Service form
// ---------------------------------------------------------------------------

function ScaleServiceForm() {
  const { env } = useEnvironment();

  const [serviceName, setServiceName] = useState('');
  const [replicas, setReplicas] = useState('1');
  const [environment, setEnvironment] = useState<ServiceEnvironment>('dev');
  const [confirm, setConfirm] = useState(false);

  const scaleMut = useMutation({
    mutationFn: () =>
      scaleService(env, serviceName.trim(), Number(replicas), environment),
    onSuccess: () => {
      toast({
        title: 'Scale operation submitted',
        description: `${serviceName} → ${replicas} replica(s) in ${environment}`,
      });
      setConfirm(false);
    },
    onError: (e: Error) => {
      toast({ title: 'Scale failed', description: e.message, variant: 'destructive' });
      setConfirm(false);
    },
  });

  const canSubmit = serviceName.trim() !== '' && Number(replicas) >= 0;

  return (
    <>
      <ConfirmModal
        open={confirm}
        title="Destructive Operation"
        message={`This will scale "${serviceName}" to ${replicas} replica(s) in ${environment.toUpperCase()}. Are you sure?`}
        onConfirm={() => scaleMut.mutate()}
        onCancel={() => setConfirm(false)}
      />

      <Card>
        <SectionTitle>Scale Service</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={FIELD_LABEL}>Service Name</label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. api-server"
              className={FIELD}
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>Replica Count</label>
            <input
              type="number"
              value={replicas}
              onChange={(e) => setReplicas(e.target.value)}
              min={0}
              className={FIELD}
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>Target Environment</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as ServiceEnvironment)}
              className={FIELD}
            >
              {ENVIRONMENTS.map((env) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => setConfirm(true)}
          disabled={!canSubmit || scaleMut.isPending}
          className={cn(DANGER_BUTTON, 'mt-4')}
        >
          <ServerCrash size={14} />
          {scaleMut.isPending ? 'Scaling…' : 'Scale Service'}
        </button>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------------
// Direct Traffic form
// ---------------------------------------------------------------------------

function DirectTrafficForm() {
  const { env } = useEnvironment();

  const [serviceName, setServiceName] = useState('');
  const [trafficWeight, setTrafficWeight] = useState('100');
  const [environment, setEnvironment] = useState<ServiceEnvironment>('dev');
  const [confirm, setConfirm] = useState(false);

  const directMut = useMutation({
    mutationFn: () =>
      directService(env, serviceName.trim(), Number(trafficWeight), environment),
    onSuccess: () => {
      toast({
        title: 'Traffic direction submitted',
        description: `${serviceName} → ${trafficWeight}% traffic in ${environment}`,
      });
      setConfirm(false);
    },
    onError: (e: Error) => {
      toast({ title: 'Direct failed', description: e.message, variant: 'destructive' });
      setConfirm(false);
    },
  });

  const weight = Number(trafficWeight);
  const canSubmit =
    serviceName.trim() !== '' && weight >= 0 && weight <= 100;

  return (
    <>
      <ConfirmModal
        open={confirm}
        title="Destructive Operation"
        message={`This will direct ${trafficWeight}% of traffic to "${serviceName}" in ${environment.toUpperCase()}. Are you sure?`}
        onConfirm={() => directMut.mutate()}
        onCancel={() => setConfirm(false)}
      />

      <Card>
        <SectionTitle>Direct Traffic</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={FIELD_LABEL}>Service Name</label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. api-server"
              className={FIELD}
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>Traffic Weight (0–100)</label>
            <input
              type="number"
              value={trafficWeight}
              onChange={(e) => setTrafficWeight(e.target.value)}
              min={0}
              max={100}
              className={FIELD}
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>Target Environment</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as ServiceEnvironment)}
              className={FIELD}
            >
              {ENVIRONMENTS.map((env) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => setConfirm(true)}
          disabled={!canSubmit || directMut.isPending}
          className={cn(DANGER_BUTTON, 'mt-4')}
        >
          <Shuffle size={14} />
          {directMut.isPending ? 'Directing…' : 'Direct Traffic'}
        </button>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function ServiceControlRouteComponent() {
  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Service Control</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Scale Kubernetes deployments and direct traffic weights for services
          managed by OperatorAgentService.
        </p>
      </div>

      {/* Destructive operations banner */}
      <div className="flex items-start gap-3 rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <div>
          <strong>WARNING:</strong> Service Control operations directly affect
          production infrastructure. Use with extreme caution. All actions are
          irreversible and take effect immediately.
        </div>
      </div>

      {/* Scale Service */}
      <ScaleServiceForm />

      {/* Direct Traffic */}
      <DirectTrafficForm />
    </div>
  );
}
