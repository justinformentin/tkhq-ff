import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'primary-soft'
  | 'success-soft'
  | 'danger-soft'
  | 'warning-soft'
  | 'ghost'
  | 'ghost-danger';

export type ButtonSize = 'sm' | 'md' | 'icon';

const BASE =
  'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:cursor-not-allowed';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary:
    'border border-border text-muted-foreground hover:bg-hover-overlay hover:text-foreground',
  danger: 'bg-danger text-primary-foreground hover:opacity-90',
  'primary-soft':
    'border border-primary-border bg-primary-soft text-primary hover:opacity-90',
  'success-soft':
    'border border-success-border bg-success-soft text-success hover:opacity-90',
  'danger-soft':
    'border border-danger-border bg-danger-soft text-danger hover:opacity-90',
  'warning-soft':
    'border border-warning-border bg-warning-soft text-warning hover:opacity-90',
  ghost: 'text-muted-foreground hover:bg-hover-overlay hover:text-foreground',
  'ghost-danger': 'text-danger hover:bg-danger-soft',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'gap-1.5 rounded-lg px-3 py-1.5 text-sm',
  md: 'gap-2 rounded-lg px-4 py-2 text-sm',
  icon: 'rounded-md p-1.5',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * The single button in the app. Reach for a variant before reaching for
 * `className` — one-off colours here are how the duplicated class strings
 * this component replaced got started.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  );
}
