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

export interface OrgFlagMatch {
  flag: FeatureFlag;
  in_allowed: boolean;
  in_disallowed: boolean;
}

export interface OrgSearchResponse {
  org_id: string;
  matches: OrgFlagMatch[];
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

// ---------------------------------------------------------------------------
// Org Operations types (mirror backend/grpc/types.ts wire shapes)
// ---------------------------------------------------------------------------

export interface ProtoTimestamp {
  seconds: string;
  nanos: number;
}

export interface OrgRefs {
  org_id: string;
  billing_org_id: string;
  customer_id: string;
  product_type: string;
  is_cached: boolean;
  product_sub_type?: string;
}

export interface RateLimit {
  category: string;
  requests_per_minute: number;
  rule: string;
  rule_variant?: string;
  remediation: string;
  expires_at?: ProtoTimestamp;
  bucket_type: string;
  id: number;
  product_type: string;
  notes: string;
  product_sub_type?: string;
}

export interface GetRateLimitResponse {
  org_id: string;
  billing_org_id: string;
  product_type: string;
  rate_limits: RateLimit[];
  product_sub_type?: string;
}

export interface GetDefaultRateLimitsResponse {
  limits: RateLimit[];
}

export interface Interdiction {
  key: string;
  owners: string[];
}

export interface GetInterdictionsResponse {
  interdictions: Interdiction[];
}

export interface SetInterdictorBlockResponse {
  raw_key: string;
  was_blocked: boolean;
}

export interface QuotaOverride {
  org_id: string;
  label: string;
  count: number;
}

export interface GetQuotaOverridesResponse {
  items: QuotaOverride[];
}

export interface OrgStatusResponse {
  org_id: string;
  refs: OrgRefs;
  rate_limit: GetRateLimitResponse;
  interdictions: GetInterdictionsResponse;
  quotas: GetQuotaOverridesResponse;
}

// Enum name display helpers — sourced from proto, wire numbers NOT remapped.
export const RATE_LIMIT_RULE_TYPE_NAMES: Record<string, string> = {
  RATE_LIMIT_RULE_TYPE_UNSPECIFIED: 'Unspecified',
  RATE_LIMIT_RULE_TYPE_ALL: 'All',
  RATE_LIMIT_RULE_TYPE_GET_ACTIVITY: 'Get Activity (deprecated)',
  RATE_LIMIT_RULE_TYPE_QUERY: 'Query',
  RATE_LIMIT_RULE_TYPE_DISCRETE: 'Discrete',
  RATE_LIMIT_RULE_TYPE_SIGN: 'Sign',
};

export const RATE_LIMIT_RULE_TYPES = Object.entries(
  RATE_LIMIT_RULE_TYPE_NAMES
).map(([value, label]) => ({ value, label }));

export const RATE_LIMIT_REMEDIATION_NAMES: Record<string, string> = {
  RATE_LIMIT_REMEDIATION_UNSPECIFIED: 'Unspecified',
  RATE_LIMIT_REMEDIATION_SOFT_THROTTLE: 'Soft Throttle',
  RATE_LIMIT_REMEDIATION_HARD_THROTTLE: 'Hard Throttle',
  RATE_LIMIT_REMEDIATION_SOFT_BLOCK: 'Soft Block',
  RATE_LIMIT_REMEDIATION_HARD_BLOCK: 'Hard Block',
};

export const RATE_LIMIT_REMEDIATIONS = Object.entries(
  RATE_LIMIT_REMEDIATION_NAMES
).map(([value, label]) => ({ value, label }));

export const RATE_LIMIT_BUCKET_TYPE_NAMES: Record<string, string> = {
  RATE_LIMIT_BUCKET_TYPE_UNSPECIFIED: 'Unspecified',
  RATE_LIMIT_BUCKET_TYPE_FAMILY: 'Family',
  RATE_LIMIT_BUCKET_TYPE_INHERITED: 'Inherited',
  RATE_LIMIT_BUCKET_TYPE_SELF: 'Self',
};

export const RATE_LIMIT_BUCKET_TYPES = Object.entries(
  RATE_LIMIT_BUCKET_TYPE_NAMES
).map(([value, label]) => ({ value, label }));
