import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

export type LabelProps = React.ComponentPropsWithoutRef<
  typeof LabelPrimitive.Root
>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn('mb-1 block text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}
