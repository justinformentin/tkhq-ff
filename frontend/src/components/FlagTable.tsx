import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listFlags, setFlag } from '../lib/api';
import { formatFlagName } from '../lib/utils';
import { Switch } from './Switch';
import { useToast } from '../hooks/useToast';
import { ChevronRight, Search } from 'lucide-react';
import { useEnvironment } from '../lib/environment';

export function FlagTable() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { env } = useEnvironment();

  // withOrgs: the Overrides column counts org rules, which the plain list
  // response doesn't carry.
  const { data: flags, isLoading, error } = useQuery({
    queryKey: ['flags', env],
    queryFn: () => listFlags(env, true),
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      flag,
      enabled,
      rollout_percent,
    }: {
      flag: string;
      enabled: boolean;
      rollout_percent: number;
    }) => setFlag(flag, env, enabled, rollout_percent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags', env] });
      toast({ title: 'Flag updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Feature Flags
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Manage feature flag rollout and per-org/product overrides
          </p>
        </div>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {isLoading ? '...' : `${filtered.length} flag${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--color-text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search flags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: 'var(--color-danger)',
          }}
        >
          Failed to load flags: {(error as Error).message}
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface)' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Flag
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Enabled
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Rollout
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Orgs
              </th>
              <th className="w-8 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-t animate-pulse"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="h-4 rounded w-48" style={{ backgroundColor: 'var(--color-surface-2)' }} />
                      <div className="h-3 rounded w-32 mt-1" style={{ backgroundColor: 'var(--color-surface-2)' }} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 rounded w-9" style={{ backgroundColor: 'var(--color-surface-2)' }} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 rounded w-10" style={{ backgroundColor: 'var(--color-surface-2)' }} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 rounded w-12" style={{ backgroundColor: 'var(--color-surface-2)' }} />
                    </td>
                    <td />
                  </tr>
                ))
              : filtered.map((flag) => (
                  <tr
                    key={flag.flag}
                    className="border-t cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--color-border)' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        'var(--color-surface)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '';
                    }}
                    onClick={() => navigate(`/flags/${flag.flag}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                        {formatFlagName(flag.flag)}
                      </div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
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
                        <div
                          className="h-1.5 rounded-full w-16 overflow-hidden"
                          style={{ backgroundColor: 'var(--color-surface-2)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${flag.rollout_percent}%`,
                              backgroundColor: 'var(--color-primary)',
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                          {flag.rollout_percent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {(flag.allowed_orgs?.length || 0) > 0 && (
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: 'var(--color-success)',
                            }}
                          >
                            +{flag.allowed_orgs.length}
                          </span>
                        )}
                        {(flag.disallowed_orgs?.length || 0) > 0 && (
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: 'var(--color-danger)',
                            }}
                          >
                            -{flag.disallowed_orgs.length}
                          </span>
                        )}
                        {!flag.allowed_orgs?.length && !flag.disallowed_orgs?.length && (
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && !error && (
          <div className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No flags match your search
          </div>
        )}
      </div>
    </div>
  );
}
