import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFlagOrg, removeFlagOrg } from '../lib/api';
import type { OrgRule } from '../types';
import { useToast } from '../hooks/useToast';
import { Trash2, Plus } from 'lucide-react';

interface OrgTabProps {
  flagName: string;
  allowedOrgs: OrgRule[];
  disallowedOrgs: OrgRule[];
}

export function OrgTab({ flagName, allowedOrgs, disallowedOrgs }: OrgTabProps) {
  const [orgId, setOrgId] = useState('');
  const [orgEnabled, setOrgEnabled] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: () => addFlagOrg(flagName, orgId.trim(), orgEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flag', flagName] });
      setOrgId('');
      toast({ title: 'Org added', description: `Org ${orgEnabled ? 'allowed' : 'denied'} successfully.` });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFlagOrg(flagName, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flag', flagName] });
      toast({ title: 'Org removed' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const allOrgs = [
    ...allowedOrgs.map((o) => ({ ...o, ruleType: 'allow' as const })),
    ...disallowedOrgs.map((o) => ({ ...o, ruleType: 'deny' as const })),
  ];

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div
        className="rounded-lg border p-4 space-y-4"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Add Org Override
        </h3>
        <div className="space-y-1.5">
          <label
            className="text-xs font-medium"
            style={{ color: 'var(--color-text-muted)' }}
            htmlFor="org-id-input"
          >
            Org UUID
          </label>
          <input
            id="org-id-input"
            type="text"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="w-full px-3 py-2 rounded-md border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOrgEnabled(true)}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={
              orgEnabled
                ? { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.4)' }
                : { backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }
            }
          >
            Allow
          </button>
          <button
            onClick={() => setOrgEnabled(false)}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={
              !orgEnabled
                ? { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.4)' }
                : { backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }
            }
          >
            Deny
          </button>
        </div>
        <button
          onClick={() => addMutation.mutate()}
          disabled={!orgId.trim() || addMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-opacity disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          <Plus size={14} />
          {addMutation.isPending ? 'Adding...' : 'Add Org'}
        </button>
      </div>

      {/* Org list */}
      <div className="space-y-2">
        {allOrgs.length === 0 ? (
          <div
            className="py-10 text-center text-sm rounded-lg border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            No org overrides configured
          </div>
        ) : (
          allOrgs.map((org) => (
            <div
              key={org.org_id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={
                    org.ruleType === 'allow'
                      ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }
                      : { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)' }
                  }
                >
                  {org.ruleType === 'allow' ? 'Allow' : 'Deny'}
                </span>
                <span className="font-mono text-sm" style={{ color: 'var(--color-text)' }}>
                  {org.org_id}
                </span>
              </div>
              <button
                onClick={() => removeMutation.mutate(org.org_id)}
                disabled={removeMutation.isPending}
                className="p-1.5 rounded-md transition-colors hover:bg-red-900/20 disabled:opacity-50"
                style={{ color: 'var(--color-text-muted)' }}
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
