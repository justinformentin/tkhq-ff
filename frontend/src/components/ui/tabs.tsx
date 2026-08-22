import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('flex gap-1 border-b border-border', className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
        'data-[state=active]:border-primary data-[state=active]:text-foreground',
        'data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground',
        'hover:data-[state=inactive]:text-foreground',
        className
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
