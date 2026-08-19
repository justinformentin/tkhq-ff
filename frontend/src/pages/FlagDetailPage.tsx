import { useParams, Link } from 'react-router-dom';
import { FlagDetail } from '../components/FlagDetail';
import { ArrowLeft } from 'lucide-react';

export function FlagDetailPage() {
  const { flag } = useParams<{ flag: string }>();
  if (!flag) {
    return (
      <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Flag not found
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
