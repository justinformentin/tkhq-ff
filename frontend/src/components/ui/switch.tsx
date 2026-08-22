import * as RadixSwitch from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
}: SwitchProps) {
  return (
    <RadixSwitch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-primary' : 'bg-switch-off'
      )}
    >
      <RadixSwitch.Thumb
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-card-background shadow transition-transform',
          checked ? 'translate-x-4.5' : 'translate-x-0.5'
        )}
      />
    </RadixSwitch.Root>
  );
}
