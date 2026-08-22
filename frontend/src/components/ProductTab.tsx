import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useEnvironment } from '@/lib/environment';
import { cn } from '@/lib/utils';
import { RuleToggle } from './RuleToggle';
import { useFlagProductMutations } from '@/hooks/flags/useFlagProductMutations';
import type { ProductRule } from '@/types';
import {
  PRODUCT_TYPES,
  PRODUCT_SUB_TYPES,
  PRODUCT_TYPE_NAMES,
  PRODUCT_SUB_TYPE_NAMES,
  ANY_SUB_TYPE,
} from '@/types';

interface ProductTabProps {
  flagName: string;
  allowedProducts: ProductRule[];
  disallowedProducts: ProductRule[];
}

const SELECT =
  'w-full rounded-md border border-border bg-elevated-background px-2 py-1.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export function ProductTab({
  flagName,
  allowedProducts,
  disallowedProducts,
}: ProductTabProps) {
  const [productType, setProductType] = useState<string>('PRODUCT_TYPE_FREE');
  const [productSubType, setProductSubType] = useState<string>(ANY_SUB_TYPE);
  const [productEnabled, setProductEnabled] = useState(true);
  const { env } = useEnvironment();
  const { addMutation, removeMutation } = useFlagProductMutations(env, flagName);

  const allRules = [
    ...allowedProducts.map((p) => ({ ...p, ruleType: 'allow' as const })),
    ...disallowedProducts.map((p) => ({ ...p, ruleType: 'deny' as const })),
  ];

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="rounded-lg border border-border bg-card-background p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Add Product Rule
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Product Type
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className={SELECT}
            >
              {PRODUCT_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Sub-Type
            </label>
            <select
              value={productSubType}
              onChange={(e) => setProductSubType(e.target.value)}
              className={SELECT}
            >
              {PRODUCT_SUB_TYPES.map((pst) => (
                <option key={pst.value} value={pst.value}>
                  {pst.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <RuleToggle value={productEnabled} onChange={setProductEnabled} />
        <button
          onClick={() =>
            addMutation.mutate({
              productType,
              productSubType,
              enabled: productEnabled,
            })
          }
          disabled={addMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          <Plus size={14} />
          {addMutation.isPending ? 'Adding...' : 'Add Rule'}
        </button>
      </div>

      {/* Rules list */}
      <div className="space-y-2">
        {allRules.length === 0 ? (
          <div className="py-10 text-center text-sm rounded-lg border border-border text-muted-foreground">
            No product rules configured
          </div>
        ) : (
          allRules.map((rule, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-card-background px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    rule.ruleType === 'allow'
                      ? 'bg-success-soft text-success'
                      : 'bg-danger-soft text-danger'
                  )}
                >
                  {rule.ruleType === 'allow' ? 'Allow' : 'Deny'}
                </span>
                <span className="text-sm text-foreground">
                  {PRODUCT_TYPE_NAMES[rule.product_type] ||
                    `type:${rule.product_type}`}
                  {rule.product_sub_type !== ANY_SUB_TYPE && (
                    <span className="text-muted-foreground">
                      {' / '}
                      {PRODUCT_SUB_TYPE_NAMES[rule.product_sub_type] ||
                        `sub:${rule.product_sub_type}`}
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
