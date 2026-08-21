import { createFileRoute } from '@tanstack/react-router';
import { FlagTable } from '@/components/FlagTable';

export const Route = createFileRoute('/flags/')({
  component: FlagsIndexRouteComponent,
});

function FlagsIndexRouteComponent() {
  return (
    <div className="p-8">
      <FlagTable />
    </div>
  );
}
