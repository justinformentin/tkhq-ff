import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFlagOrg, removeFlagOrg } from '../lib/api';
import type { OrgRule } from '../types';
import { useToast } from '../hooks/useToast';
import { Trash2, Plus } from 'lucide-react';
import { useEnvironment } from '../lib/environment';
import { cn } from '../lib/utils';
import { RuleToggle } from './RuleToggle';

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
  const { env } = useEnvironment();

  const addMutation = useMutation({
    mutationFn: () => addFlagOrg(flagName, env, orgId.trim(), orgEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flag', env, flagName] });
      setOrgId('');
      toast({
        title: 'Org added',
        description: `Org ${orgEnabled ? 'allowed' : 'denied'} successfully.`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFlagOrg(flagName, env, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flag', env, flagName] });
      toast({ title: 'Org removed' });
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const allOrgs = [
    ...allowedOrgs.map((o) => ({ ...o, ruleType: 'allow' as const })),
    ...disallowedOrgs.map((o) => ({ ...o, ruleType: 'deny' as const })),
  ];

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="rounded-lg border border-border bg-card-background p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Add Org Override
        </h3>
        <div className="space-y-1.5">
          <label
            className="text-xs font-medium text-muted-foreground"
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
            className="w-full px-3 py-2 rounded-md border border-border bg-elevated-background text-sm font-mono text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <RuleToggle value={orgEnabled} onChange={setOrgEnabled} />
        <button
          onClick={() => addMutation.mutate()}
          disabled={!orgId.trim() || addMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          <Plus size={14} />
          {addMutation.isPending ? 'Adding...' : 'Add Org'}
        </button>
      </div>

      {/* Org list */}
      <div className="space-y-2">
        {allOrgs.length === 0 ? (
          <div className="py-10 text-center text-sm rounded-lg border border-border text-muted-foreground">
            No org overrides configured
          </div>
        ) : (
          allOrgs.map((org) => (
            <div
              key={org.org_id}
              className="flex items-center justify-between rounded-lg border border-border bg-card-background px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    org.ruleType === 'allow'
                      ? 'bg-success-soft text-success'
                      : 'bg-danger-soft text-danger'
                  )}
                >
                  {org.ruleType === 'allow' ? 'Allow' : 'Deny'}
                </span>
                <span className="font-mono text-sm text-foreground">
                  {org.org_id}
                </span>
              </div>
              <button
                onClick={() => removeMutation.mutate(org.org_id)}
                disabled={removeMutation.isPending}
                className="p-1.5 rounded-md text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"
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
