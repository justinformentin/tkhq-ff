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
      <div className="p-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Flag not found
      </div>
    );
  }

  return (
    <div className="p-8 space-y-4">
      <Link
        to="/flags"
        className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <ArrowLeft size={14} />
        Back to flags
      </Link>
      <FlagDetail flagName={flag} />
    </div>
  );
}
