import { Trash2 } from 'lucide-react';
import {
  RATE_LIMIT_RULE_TYPE_NAMES,
  RATE_LIMIT_REMEDIATION_NAMES,
  RATE_LIMIT_BUCKET_TYPE_NAMES,
} from '@/types';
import type { RateLimit } from '@/types';

function labelFor<T extends Record<string, string>>(
  names: T,
  value: string
): string {
  return names[value] ?? value;
}

interface RateLimitRowProps {
  rl: RateLimit;
  onRemove?: () => void;
  isProduction: boolean;
}

export function RateLimitRow({ rl, onRemove, isProduction }: RateLimitRowProps) {
  return (
    <div className="rounded-lg border border-border bg-card-background px-4 py-3 text-sm space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">
          {labelFor(RATE_LIMIT_RULE_TYPE_NAMES, rl.rule)}
          {rl.rule_variant ? ` / ${rl.rule_variant}` : ''}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-soft text-primary">
            {rl.requests_per_minute} rpm
          </span>
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1 rounded text-danger transition-colors hover:bg-danger-soft"
              title={`Remove this rate limit${isProduction ? ' (LIVE)' : ''}`}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="text-xs space-x-3 text-muted-foreground">
        <span>
          Category: {labelFor(RATE_LIMIT_RULE_TYPE_NAMES, rl.category)}
        </span>
        <span>
          Remediation: {labelFor(RATE_LIMIT_REMEDIATION_NAMES, rl.remediation)}
        </span>
        <span>
          Bucket: {labelFor(RATE_LIMIT_BUCKET_TYPE_NAMES, rl.bucket_type)}
        </span>
        {rl.notes && <span>Notes: {rl.notes}</span>}
      </div>
    </div>
  );
}
