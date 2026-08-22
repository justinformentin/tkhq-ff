import { CheckCircle2, XCircle } from 'lucide-react';

interface AppliedBadgeProps {
  applied: boolean;
}

export function AppliedBadge({ applied }: AppliedBadgeProps) {
  return applied ? (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-success-soft text-success">
      <CheckCircle2 size={12} />
      Applied
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-warning-soft text-warning">
      <XCircle size={12} />
      Pending
    </span>
  );
}
