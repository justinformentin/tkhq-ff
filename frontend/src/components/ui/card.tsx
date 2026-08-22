import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card-background p-5',
        className
      )}
    >
      {children}
    </div>
  );
}
