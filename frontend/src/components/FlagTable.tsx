import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { formatFlagName } from '@/lib/utils';
import { Switch } from './Switch';
import { ChevronRight, Search } from 'lucide-react';
import { useEnvironment } from '@/lib/environment';
import { useFlagList } from '@/hooks/flags/useFlagList';
import { useToggleFlag } from '@/hooks/flags/useToggleFlag';

const HEADER_CELL =
  'text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground';

export function FlagTable() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { env } = useEnvironment();

  // withOrgs: the Overrides column counts org rules, which the plain list
  // response doesn't carry.
  const { data: flags, isLoading, error } = useFlagList(env, true);
  const toggleMutation = useToggleFlag(env);

  // The flag name is the row's identity — it keys the React list and the detail
  // route — so collapse any repeats the agent reports rather than rendering
  // rows that can't be told apart.
  const unique = Array.from(
    new Map((flags || []).map((f) => [f.flag, f])).values()
  );

  const filtered = unique.filter(
    (f) =>
      f.flag.toLowerCase().includes(search.toLowerCase()) ||
      formatFlagName(f.flag).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feature Flags</h1>
          <p className="text-sm mt-0.5 text-muted-foreground">
            Manage feature flag rollout and per-org/product overrides
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {isLoading
            ? '...'
            : `${filtered.length} flag${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search flags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          Failed to load flags: {(error as Error).message}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-card-background">
              <th className={HEADER_CELL}>Flag</th>
              <th className={HEADER_CELL}>Enabled</th>
              <th className={HEADER_CELL}>Rollout</th>
              <th className={HEADER_CELL}>Orgs</th>
              <th className="w-8 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-t border-border animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-4 rounded w-48 bg-elevated-background" />
                      <div className="h-3 rounded w-32 mt-1 bg-elevated-background" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 rounded w-9 bg-elevated-background" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 rounded w-10 bg-elevated-background" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 rounded w-12 bg-elevated-background" />
                    </td>
                    <td />
                  </tr>
                ))
              : filtered.map((flag) => (
                  <tr
                    key={flag.flag}
                    className="border-t border-border cursor-pointer transition-colors hover:bg-card-background-hover"
                    onClick={() =>
                      void navigate({
                        to: '/flags/$flag',
                        params: { flag: flag.flag },
                      })
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-foreground">
                        {formatFlagName(flag.flag)}
                      </div>
                      <div className="text-xs font-mono mt-0.5 text-muted-foreground">
                        {flag.flag}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({
                            flag: flag.flag,
                            enabled: checked,
                            rollout_percent: flag.rollout_percent,
                          })
                        }
                        disabled={toggleMutation.isPending}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 rounded-full w-16 overflow-hidden bg-elevated-background">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${flag.rollout_percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {flag.rollout_percent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {(flag.allowed_orgs?.length || 0) > 0 && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-success-soft text-success">
                            +{flag.allowed_orgs.length}
                          </span>
                        )}
                        {(flag.disallowed_orgs?.length || 0) > 0 && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-danger-soft text-danger">
                            -{flag.disallowed_orgs.length}
                          </span>
                        )}
                        {!flag.allowed_orgs?.length &&
                          !flag.disallowed_orgs?.length && (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight
                        size={14}
                        className="text-muted-foreground"
                      />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && !error && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No flags match your search
          </div>
        )}
      </div>
    </div>
  );
}
