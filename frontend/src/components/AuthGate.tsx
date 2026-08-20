import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { LogIn } from 'lucide-react';
import { getIdentity } from '../lib/api';

interface AuthErrorBody {
  error?: string;
  loginUrl?: string;
}

/**
 * Blocks the app until the backend can name who it will act as.
 *
 * In cache mode that's whoever ran `tkinfra login` on this machine, so this
 * resolves immediately. In oidc mode there's no identity until the user signs
 * in, and the backend says where to send them.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, error } = useQuery({
    queryKey: ['identity'],
    queryFn: getIdentity,
    retry: false,
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-sm"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Checking sign-in…
      </div>
    );
  }

  if (error) {
    const body = (error as AxiosError<AuthErrorBody>).response?.data;
    const loginUrl = body?.loginUrl;
    const message = body?.error || (error as Error).message;

    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div
          className="w-full max-w-md rounded-lg border p-6 text-center"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h1
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            Sign in required
          </h1>
          <p
            className="mt-2 whitespace-pre-line text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {message}
          </p>

          {loginUrl && (
            <a
              href={`${loginUrl}?returnTo=${encodeURIComponent(
                window.location.pathname + window.location.search
              )}`}
              className="mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <LogIn size={14} />
              Sign in with Turnkey SSO
            </a>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
