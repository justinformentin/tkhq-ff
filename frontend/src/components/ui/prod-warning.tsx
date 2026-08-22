import { AlertTriangle } from 'lucide-react';

interface ProdWarningProps {
  env: string;
}

/**
 * ProdWarning — banner shown when the selected environment is preprod or prod.
 * Returns null for non-production environments.
 */
export function ProdWarning({ env }: ProdWarningProps) {
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
