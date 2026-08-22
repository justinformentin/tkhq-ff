import { cn } from '../lib/utils';

const BASE = 'px-3 py-1.5 rounded-md text-sm font-medium border transition-colors';
const UNSELECTED = 'bg-transparent text-muted-foreground border-border';

/**
 * The Allow/Deny pair that fronts both the org and product override forms.
 * `value` is the allow side, matching the `enabled` field both rules carry.
 */
export function RuleToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (allow: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          BASE,
          value ? 'bg-success-soft text-success border-success-border' : UNSELECTED
        )}
      >
        Allow
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          BASE,
          value ? UNSELECTED : 'bg-danger-soft text-danger border-danger-border'
        )}
      >
        Deny
      </button>
    </div>
  );
}
