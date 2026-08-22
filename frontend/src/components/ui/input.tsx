import { cn } from '@/lib/utils';

/** Shared by every text-entry control so inputs and selects line up. */
export const CONTROL_BASE =
  'w-full rounded-lg border border-border bg-card-background px-3 py-2 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Render the value in the mono face — for UUIDs, domains, and addresses. */
  mono?: boolean;
}

export function Input({
  mono,
  className,
  type = 'text',
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      className={cn(CONTROL_BASE, mono && 'font-mono', className)}
      {...props}
    />
  );
}
