import { cn } from '@/lib/utils';

export type SliderProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
>;

export function Slider({ className, ...props }: SliderProps) {
  return (
    <input
      type="range"
      className={cn('w-full cursor-pointer accent-primary', className)}
      {...props}
    />
  );
}
