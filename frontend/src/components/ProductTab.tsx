import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useEnvironment } from '@/lib/environment';
import { cn } from '@/lib/utils';
import { RuleToggle } from './RuleToggle';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
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
          <Field label="Product Type" htmlFor="product-type">
            <Select
              id="product-type"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              options={PRODUCT_TYPES}
            />
          </Field>
          <Field label="Sub-Type" htmlFor="product-sub-type">
            <Select
              id="product-sub-type"
              value={productSubType}
              onChange={(e) => setProductSubType(e.target.value)}
              options={PRODUCT_SUB_TYPES}
            />
          </Field>
        </div>
        <RuleToggle value={productEnabled} onChange={setProductEnabled} />
        <Button
          onClick={() =>
            addMutation.mutate({
              productType,
              productSubType,
              enabled: productEnabled,
            })
          }
          disabled={addMutation.isPending}
        >
          <Plus size={14} />
          {addMutation.isPending ? 'Adding...' : 'Add Rule'}
        </Button>
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
              <Button
                variant="ghost-danger"
                size="icon"
                onClick={() =>
                  removeMutation.mutate({
                    type: rule.product_type,
                    subType: rule.product_sub_type,
                  })
                }
                disabled={removeMutation.isPending}
                title="Remove"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
