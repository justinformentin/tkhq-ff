import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { getIdentity, logout } from '../lib/api';

/**
 * Names the identity the backend acts as. Worth showing even in cache mode:
 * it's whoever ran `tkinfra login` on this machine, which is not always the
 * person looking at the screen.
 */
export function UserMenu() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['identity'],
    queryFn: getIdentity,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const signOut = useMutation({
    mutationFn: logout,
    onSuccess: (logoutUrl) => {
      queryClient.clear();
      // Ending the Keycloak session too, so "sign out" doesn't silently sign
      // straight back in on the next click.
      window.location.href = logoutUrl ?? '/';
    },
  });

  if (!data) return null;

  const name = data.user.username || data.user.email || data.user.name;

  return (
    <div className="flex items-center gap-2">
      {name && (
        <span
          className="text-xs text-muted-foreground"
          title={
            data.source === 'tkinfra'
              ? 'Borrowed from your tkinfra login on this machine'
              : 'Signed in'
          }
        >
          {name}
        </span>
      )}
      {data.source === 'session' && (
        <button
          onClick={() => signOut.mutate()}
          disabled={signOut.isPending}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-hover-overlay hover:text-foreground disabled:opacity-50"
          title="Sign out"
        >
          <LogOut size={14} />
        </button>
      )}
    </div>
  );
}
