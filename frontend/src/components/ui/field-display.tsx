/**
 * FieldDisplay — a label/value row used in detail panels.
 * The label column width can differ per context; the default is w-40.
 */
interface FieldDisplayProps {
  label: string;
  value: React.ReactNode;
  /** Tailwind width class for the label column. Defaults to "w-40". */
  labelWidth?: string;
}

export function FieldDisplay({
  label,
  value,
  labelWidth = 'w-40',
}: FieldDisplayProps) {
  return (
    <div className="flex items-start gap-4 text-sm py-2 border-b border-border last:border-0">
      <span
        className={`${labelWidth} shrink-0 font-medium text-muted-foreground`}
      >
        {label}
      </span>
      <span className="font-mono break-all text-foreground">{value}</span>
    </div>
  );
}
