// Product/sub-type values are the proto enum names from
// immutable.common.v1 — the backend passes them through untouched, so nothing
// here maps them onto local integers.

export interface OrgRule {
  org_id: string;
}

export interface ProductRule {
  product_type: string;
  product_sub_type: string;
}

export interface FeatureFlag {
  flag: string;
  enabled: boolean;
  rollout_percent: number;
  is_deprecated: boolean;
  allowed_orgs: OrgRule[];
  disallowed_orgs: OrgRule[];
  allowed_products: ProductRule[];
  disallowed_products: ProductRule[];
}

export interface ListFlagsResponse {
  flags: FeatureFlag[];
}

export interface GetFlagResponse {
  flag: FeatureFlag;
}

export const ANY_SUB_TYPE = 'PRODUCT_SUB_TYPE_UNSPECIFIED';

export const PRODUCT_TYPE_NAMES: Record<string, string> = {
  PRODUCT_TYPE_FREE: 'Free',
  PRODUCT_TYPE_ENTERPRISE: 'Enterprise',
  PRODUCT_TYPE_PAY_AS_YOU_GO: 'Pay-as-you-go',
  PRODUCT_TYPE_PRO: 'Pro',
};

export const PRODUCT_SUB_TYPE_NAMES: Record<string, string> = {
  [ANY_SUB_TYPE]: '(any)',
  PRODUCT_SUB_TYPE_ENTERPRISE_SCALE: 'Scale',
  PRODUCT_SUB_TYPE_ENTERPRISE_GROWTH: 'Growth',
  PRODUCT_SUB_TYPE_ENTERPRISE_STRATEGIC: 'Strategic',
  PRODUCT_SUB_TYPE_PRO_LEGACY: 'Pro Legacy',
  PRODUCT_SUB_TYPE_ENTERPRISE_PRO_PLUS: 'Pro Plus',
  PRODUCT_SUB_TYPE_ENTERPRISE_LARGE: 'Large',
};

export const PRODUCT_TYPES = Object.entries(PRODUCT_TYPE_NAMES).map(
  ([value, label]) => ({ value, label })
);

export const PRODUCT_SUB_TYPES = [
  { value: ANY_SUB_TYPE, label: '(any sub-type)' },
  ...Object.entries(PRODUCT_SUB_TYPE_NAMES)
    .filter(([value]) => value !== ANY_SUB_TYPE)
    .map(([value, label]) => ({ value, label })),
];
