import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONTROL_BASE } from './input';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'children'
> {
  /** Options to render. Every select in the app lists a value/label pair. */
  options: readonly SelectOption[];
  /** Class for the positioning wrapper, not the control itself. */
  wrapperClassName?: string;
}

export function Select({
  options,
  className,
  wrapperClassName,
  ...props
}: SelectProps) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <select
        className={cn(
          CONTROL_BASE,
          'cursor-pointer appearance-none pr-8',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
