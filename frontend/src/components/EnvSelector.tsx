import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select } from '@/components/ui/select';
import {
  ENVIRONMENTS,
  PRODUCTION_ENVIRONMENTS,
  useEnvironment,
  type Environment,
} from '@/lib/environment';

const LABELS: Record<Environment, string> = {
  local: 'Local',
  dev: 'Dev',
  preprod: 'Preprod',
  prod: 'Prod',
};

export function EnvSelector() {
  const { env, setEnv, isProduction } = useEnvironment();

  return (
    <div className="flex items-center gap-2">
      {isProduction && (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger"
          title="Changes here affect a production environment"
        >
          <AlertTriangle size={12} />
          {LABELS[env]}
        </span>
      )}

      <Select
        value={env}
        onChange={(e) => setEnv(e.target.value as Environment)}
        aria-label="Environment"
        options={ENVIRONMENTS.map((name) => ({
          value: name,
          label: `${LABELS[name]}${PRODUCTION_ENVIRONMENTS.includes(name) ? ' ⚠' : ''}`,
        }))}
        className={cn(
          'w-auto py-1.5 font-medium',
          isProduction && 'border-danger-border'
        )}
      />
    </div>
  );
}
