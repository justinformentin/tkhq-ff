import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchOrg } from '@/lib/api';
import { formatFlagName } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useEnvironment } from '@/lib/environment';

export const Route = createFileRoute('/orgs/')({
  component: OrgSearchRouteComponent,
});

function OrgSearchRouteComponent() {
  const [orgInput, setOrgInput] = useState('');
  const [searchedOrg, setSearchedOrg] = useState('');
  const { env } = useEnvironment();

  const {
    data: results,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['org-search', env, searchedOrg],
    queryFn: () => searchOrg(searchedOrg, env),
    enabled: !!searchedOrg,
  });

  function handleSearch() {
    if (orgInput.trim()) setSearchedOrg(orgInput.trim());
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Search by Org</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Enter an org UUID to see which feature flags it has overrides for.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={orgInput}
          onChange={(e) => setOrgInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-card-background text-sm font-mono text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleSearch}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Search size={14} />
          Search
        </button>
      </div>

      {searchedOrg && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-8 text-center text-sm animate-pulse text-muted-foreground">
              Searching...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
              {error instanceof Error ? error.message : 'Search failed'}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {!results?.length
                  ? `No flag overrides found for ${searchedOrg}`
                  : `${results.length} flag${results.length !== 1 ? 's' : ''} with overrides for this org`}
              </p>
              {(results ?? []).map(({ flag, in_allowed, in_disallowed }) => (
                <Link
                  key={flag.flag}
                  to="/flags/$flag"
                  params={{ flag: flag.flag }}
                  className="block no-underline"
                >
                  <div className="flex items-center justify-between rounded-lg border border-border bg-card-background px-4 py-3 transition-colors hover:bg-card-background-hover">
                    <div>
                      <div className="font-medium text-sm text-foreground">
                        {formatFlagName(flag.flag)}
                      </div>
                      <div className="text-xs font-mono mt-0.5 text-muted-foreground">
                        {flag.flag}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {in_allowed && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-success-soft text-success">
                          Allowed
                        </span>
                      )}
                      {in_disallowed && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-danger-soft text-danger">
                          Denied
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
