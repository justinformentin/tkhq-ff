import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFlagProduct, removeFlagProduct } from '../lib/api';
import { useEnvironment } from '../lib/environment';
import type { ProductRule } from '../types';
import { PRODUCT_TYPES, PRODUCT_SUB_TYPES, PRODUCT_TYPE_NAMES, PRODUCT_SUB_TYPE_NAMES, ANY_SUB_TYPE } from '../types';
import { useToast } from '../hooks/useToast';
import { Trash2, Plus } from 'lucide-react';

interface ProductTabProps {
  flagName: string;
  allowedProducts: ProductRule[];
  disallowedProducts: ProductRule[];
}

export function ProductTab({
  flagName,
  allowedProducts,
  disallowedProducts,
}: ProductTabProps) {
  const [productType, setProductType] = useState<string>('PRODUCT_TYPE_FREE');
  const [productSubType, setProductSubType] = useState<string>(ANY_SUB_TYPE);
  const [productEnabled, setProductEnabled] = useState(true);
  const queryClient = useQueryClient();
  const { env } = useEnvironment();
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: () => addFlagProduct(flagName, env, productType, productSubType, productEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flag', env, flagName] });
      toast({ title: 'Product rule added' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ type, subType }: { type: string; subType: string }) =>
      removeFlagProduct(flagName, env, type, subType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flag', env, flagName] });
      toast({ title: 'Product rule removed' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const allRules = [
    ...allowedProducts.map((p) => ({ ...p, ruleType: 'allow' as const })),
    ...disallowedProducts.map((p) => ({ ...p, ruleType: 'deny' as const })),
  ];

  const selectStyle = {
    backgroundColor: 'var(--color-surface-2)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    padding: '6px 8px',
    fontSize: '13px',
    width: '100%',
  } as React.CSSProperties;

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div
        className="rounded-lg border p-4 space-y-4"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Add Product Rule
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Product Type
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              style={selectStyle}
            >
              {PRODUCT_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Sub-Type
            </label>
            <select
              value={productSubType}
              onChange={(e) => setProductSubType(e.target.value)}
              style={selectStyle}
            >
              {PRODUCT_SUB_TYPES.map((pst) => (
                <option key={pst.value} value={pst.value}>
                  {pst.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setProductEnabled(true)}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={
              productEnabled
                ? { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.4)' }
                : { backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }
            }
          >
            Allow
          </button>
          <button
            onClick={() => setProductEnabled(false)}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={
              !productEnabled
                ? { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.4)' }
                : { backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }
            }
          >
            Deny
          </button>
        </div>
        <button
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-opacity disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          <Plus size={14} />
          {addMutation.isPending ? 'Adding...' : 'Add Rule'}
        </button>
      </div>

      {/* Rules list */}
      <div className="space-y-2">
        {allRules.length === 0 ? (
          <div
            className="py-10 text-center text-sm rounded-lg border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            No product rules configured
          </div>
        ) : (
          allRules.map((rule, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={
                    rule.ruleType === 'allow'
                      ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }
                      : { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)' }
                  }
                >
                  {rule.ruleType === 'allow' ? 'Allow' : 'Deny'}
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {PRODUCT_TYPE_NAMES[rule.product_type] || `type:${rule.product_type}`}
                  {rule.product_sub_type !== ANY_SUB_TYPE && (
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      {' / '}
                      {PRODUCT_SUB_TYPE_NAMES[rule.product_sub_type] || `sub:${rule.product_sub_type}`}
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={() =>
                  removeMutation.mutate({
                    type: rule.product_type,
                    subType: rule.product_sub_type,
                  })
                }
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
