import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchOrg } from '../lib/api';
import { formatFlagName } from '../lib/utils';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useEnvironment } from '../lib/environment';

export function OrgSearchPage() {
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
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Search by Org
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
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
          className="flex-1 px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
        <button
          onClick={handleSearch}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          <Search size={14} />
          Search
        </button>
      </div>

      {searchedOrg && (
        <div className="space-y-3">
          {isLoading ? (
            <div
              className="py-8 text-center text-sm animate-pulse"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Searching...
            </div>
          ) : error ? (
            <div
              className="rounded-lg border px-4 py-3 text-sm"
              style={{
                borderColor: 'var(--color-danger)',
                color: 'var(--color-danger)',
              }}
            >
              {error instanceof Error ? error.message : 'Search failed'}
            </div>
          ) : (
            <>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {!results?.length
                  ? `No flag overrides found for ${searchedOrg}`
                  : `${results.length} flag${results.length !== 1 ? 's' : ''} with overrides for this org`}
              </p>
              {(results ?? []).map(({ flag, in_allowed, in_disallowed }) => (
                <Link
                  key={flag.flag}
                  to={`/flags/${flag.flag}`}
                  className="block"
                >
                  <div
                    className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        'var(--color-surface-2)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        'var(--color-surface)';
                    }}
                  >
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                        {formatFlagName(flag.flag)}
                      </div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {flag.flag}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {in_allowed && (
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: 'var(--color-success)',
                          }}
                        >
                          Allowed
                        </span>
                      )}
                      {in_disallowed && (
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            color: 'var(--color-danger)',
                          }}
                        >
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
