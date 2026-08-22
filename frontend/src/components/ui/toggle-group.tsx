import { cn } from '@/lib/utils';
import { Button, type ButtonVariant } from './button';

export type ToggleTone = 'primary' | 'success' | 'danger';

const ACTIVE_VARIANT: Record<ToggleTone, ButtonVariant> = {
  primary: 'primary-soft',
  success: 'success-soft',
  danger: 'danger-soft',
};

export interface ToggleOption<T> {
  value: T;
  label: string;
  /** Colour of the option while selected. Defaults to `primary`. */
  tone?: ToggleTone;
}

interface ToggleGroupProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: readonly ToggleOption<T>[];
  className?: string;
}

/** A row of mutually exclusive buttons — one is always selected. */
export function ToggleGroup<T extends string | number | boolean>({
  value,
  onChange,
  options,
  className,
}: ToggleGroupProps<T>) {
  return (
    <div className={cn('flex gap-2', className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Button
            key={String(option.value)}
            size="sm"
            variant={
              selected ? ACTIVE_VARIANT[option.tone ?? 'primary'] : 'secondary'
            }
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
