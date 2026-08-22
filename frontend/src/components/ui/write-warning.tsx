import { AlertTriangle } from 'lucide-react';

interface WriteWarningProps {
  env: string;
}

/**
 * WriteWarning — inline caution banner shown above write operations in
 * production environments.
 */
export function WriteWarning({ env }: WriteWarningProps) {
  return (
    <div className="flex items-center gap-2 text-xs mb-4 px-3 py-2 rounded-md bg-warning-soft text-warning">
      <AlertTriangle size={13} /> This will write to {env.toUpperCase()}.
    </div>
  );
}
