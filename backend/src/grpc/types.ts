export interface OrgRule {
  org_id: string;
  enabled: boolean;
}

export interface ProductRule {
  product_type: number;
  product_sub_type: number;
  enabled: boolean;
}

export interface FeatureFlagInfo {
  flag: string;
  enabled: boolean;
  rollout_percent: number;
  allowed_orgs: OrgRule[];
  disallowed_orgs: OrgRule[];
  allowed_products: ProductRule[];
  disallowed_products: ProductRule[];
}

export interface ListFeatureFlagsResponse {
  flags: FeatureFlagInfo[];
}

export interface GetFeatureFlagResponse {
  flag: FeatureFlagInfo;
}

export interface SetFeatureFlagResponse {
  flag: FeatureFlagInfo;
}

export interface AddFeatureFlagOrgResponse {
  flag: FeatureFlagInfo;
}

export interface RemoveFeatureFlagOrgResponse {
  flag: FeatureFlagInfo;
}

export interface AddFeatureFlagProductResponse {
  flag: FeatureFlagInfo;
}

export interface RemoveFeatureFlagProductResponse {
  flag: FeatureFlagInfo;
}

// Product type constants (numeric values match proto enum)
export const PRODUCT_TYPES: Record<string, number> = {
  free: 1,
  payg: 2,
  pro: 3,
  enterprise: 4,
};

export const PRODUCT_SUB_TYPES: Record<string, number> = {
  none: 0,
  scale: 1,
  growth: 2,
  strategic: 3,
};

export const PRODUCT_TYPE_NAMES: Record<number, string> = {
  1: 'free',
  2: 'payg',
  3: 'pro',
  4: 'enterprise',
};

export const PRODUCT_SUB_TYPE_NAMES: Record<number, string> = {
  0: 'none',
  1: 'scale',
  2: 'growth',
  3: 'strategic',
};
