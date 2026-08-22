import { cn } from '@/lib/utils';
import { VERIFICATION_STATUS_NAMES } from '@/types';

interface VerBadgeProps {
  status: string;
}

/**
 * VerBadge — displays an SES verification status with colour coding.
 */
export function VerBadge({ status }: VerBadgeProps) {
  const label =
    VERIFICATION_STATUS_NAMES[status as keyof typeof VERIFICATION_STATUS_NAMES] ??
    status;
  const ok = status === 'VERIFICATION_STATUS_SUCCESS';
  const pending = status === 'VERIFICATION_STATUS_PENDING';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        ok
          ? 'bg-success-soft text-success'
          : pending
            ? 'bg-warning-soft text-warning'
            : 'bg-danger-soft text-danger'
      )}
    >
      {label}
    </span>
  );
}
