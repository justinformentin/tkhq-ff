import { AlertTriangle, ChevronDown } from 'lucide-react';
import {
  ENVIRONMENTS,
  PRODUCTION_ENVIRONMENTS,
  useEnvironment,
  type Environment,
} from '../lib/environment';

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
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: 'var(--color-danger)',
          }}
          title="Changes here affect a production environment"
        >
          <AlertTriangle size={12} />
          {LABELS[env]}
        </span>
      )}

      <div className="relative">
        <select
          value={env}
          onChange={(e) => setEnv(e.target.value as Environment)}
          aria-label="Environment"
          className="appearance-none rounded-md border pl-3 pr-8 py-1.5 text-sm font-medium cursor-pointer"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: isProduction
              ? 'rgba(239, 68, 68, 0.5)'
              : 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          {ENVIRONMENTS.map((name) => (
            <option key={name} value={name}>
              {LABELS[name]}
              {PRODUCTION_ENVIRONMENTS.includes(name) ? ' ⚠' : ''}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--color-text-muted)' }}
        />
      </div>
    </div>
  );
}
