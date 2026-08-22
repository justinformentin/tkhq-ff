import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatProtoDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { SUPPRESSION_REASON_NAMES } from '@/types';
import type { SuppressedEmailSummary } from '@/types';

interface SuppressionRowProps {
  row: SuppressedEmailSummary;
  onDelete: () => void;
  isPending: boolean;
}

export function SuppressionRow({ row, onDelete, isPending }: SuppressionRowProps) {
  const reasonLabel =
    SUPPRESSION_REASON_NAMES[row.reason as keyof typeof SUPPRESSION_REASON_NAMES] ??
    row.reason;
  const ts = formatProtoDate(row.last_update_time);
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-4 font-mono text-sm text-foreground break-all">
        {row.email_address}
      </td>
      <td className="py-2 pr-4 text-sm">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            row.reason === 'SUPPRESSION_LIST_REASON_BOUNCE'
              ? 'bg-warning-soft text-warning'
              : 'bg-danger-soft text-danger'
          )}
        >
          {reasonLabel}
        </span>
      </td>
      <td className="py-2 pr-4 text-xs text-muted-foreground font-mono">
        {ts}
      </td>
      <td className="py-2 text-right">
        <Button
          variant="ghost-danger"
          size="icon"
          onClick={onDelete}
          disabled={isPending}
          title="Remove from suppression list"
        >
          <Trash2 size={14} />
        </Button>
      </td>
    </tr>
  );
}
