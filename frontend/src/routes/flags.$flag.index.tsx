import { createFileRoute, Link } from '@tanstack/react-router';
import { FlagDetail } from '@/components/FlagDetail';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/flags/$flag/')({
  component: FlagDetailRouteComponent,
});

function FlagDetailRouteComponent() {
  const { flag } = Route.useParams();

  if (!flag) {
    return (
      <div className="p-8 text-sm text-muted-foreground">Flag not found</div>
    );
  }

  return (
    <div className="p-8 space-y-4">
      <Link
        to="/flags"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back to flags
      </Link>
      <FlagDetail flagName={flag} />
    </div>
  );
}
