import { Label } from './label';

interface FieldProps {
  label: React.ReactNode;
  /** Ties the label to the control; set it alongside the control's `id`. */
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * A labelled form control. Pair with `Input` / `Select`; for read-only
 * label/value rows use `FieldDisplay` instead.
 */
export function Field({ label, htmlFor, className, children }: FieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
