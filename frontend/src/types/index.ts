export interface OrgRule {
  org_id: string;
  enabled: boolean;
}

export interface ProductRule {
  product_type: number;
  product_sub_type: number;
  enabled: boolean;
}

export interface FeatureFlag {
  flag: string;
  enabled: boolean;
  rollout_percent: number;
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

export const PRODUCT_TYPE_NAMES: Record<number, string> = {
  1: 'Free',
  2: 'Pay-as-you-go',
  3: 'Pro',
  4: 'Enterprise',
};

export const PRODUCT_SUB_TYPE_NAMES: Record<number, string> = {
  0: '(any)',
  1: 'Scale',
  2: 'Growth',
  3: 'Strategic',
};

export const PRODUCT_TYPES = [
  { value: 1, label: 'Free' },
  { value: 2, label: 'Pay-as-you-go' },
  { value: 3, label: 'Pro' },
  { value: 4, label: 'Enterprise' },
] as const;

export const PRODUCT_SUB_TYPES = [
  { value: 0, label: '(any sub-type)' },
  { value: 1, label: 'Scale' },
  { value: 2, label: 'Growth' },
  { value: 3, label: 'Strategic' },
] as const;
