/**
 * Shapes returned by services.operator_agent.v1.OperatorAgentService, plus the
 * normalized shape this backend exposes over HTTP.
 *
 * The client loads protos with `enums: String`, so every enum field arrives as
 * its proto name ("FEATURE_FLAG_TVC", "PRODUCT_TYPE_FREE") rather than a
 * number. Names are carried through to the API untouched — mapping them to
 * local integers is what made the previous placeholder write to the wrong flag.
 */

// ---------------------------------------------------------------------------
// Wire types (mirror the proto exactly)
// ---------------------------------------------------------------------------

export interface FeatureFlagProductAssociation {
  product_type: string;
  product_sub_type: string;
}

export interface FeatureFlagDefinition {
  id: string;
  flag: string;
  enabled: boolean;
  rollout_percent: number;
  whitelisted_orgs: string[];
  blacklisted_orgs: string[];
  created_at?: { seconds: string; nanos: number };
  updated_at?: { seconds: string; nanos: number };
  is_deprecated: boolean;
  whitelisted_products: FeatureFlagProductAssociation[];
  blacklisted_products: FeatureFlagProductAssociation[];
}

export interface ListFeatureFlagsResponse {
  flags: FeatureFlagDefinition[];
}

export interface GetFeatureFlagResponse {
  flag: FeatureFlagDefinition;
}

// SetFeatureFlag, AddFeatureFlagOrg, RemoveFeatureFlagOrg,
// AddFeatureFlagProduct and RemoveFeatureFlagProduct all return empty
// messages — routes re-read the flag with GetFeatureFlag to return fresh state.
export type EmptyResponse = Record<string, never>;

// ---------------------------------------------------------------------------
// API types (what the frontend consumes)
// ---------------------------------------------------------------------------

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

export function toFeatureFlag(def: FeatureFlagDefinition): FeatureFlag {
  return {
    flag: def.flag,
    enabled: def.enabled,
    rollout_percent: def.rollout_percent,
    is_deprecated: def.is_deprecated,
    allowed_orgs: (def.whitelisted_orgs || []).map((org_id) => ({ org_id })),
    disallowed_orgs: (def.blacklisted_orgs || []).map((org_id) => ({ org_id })),
    allowed_products: def.whitelisted_products || [],
    disallowed_products: def.blacklisted_products || [],
  };
}

// ---------------------------------------------------------------------------
// Org Operations wire types (mirror operator_agent.proto exactly)
// ---------------------------------------------------------------------------

// OrgRefs
export interface OrgRefsRequest {
  org_id: string;
}

export interface OrgRefsResponse {
  org_id: string;
  billing_org_id: string;
  customer_id: string;
  product_type: string;
  is_cached: boolean;
  product_sub_type?: string;
}

// RateLimit (shared message)
export interface ProtoTimestamp {
  seconds: string;
  nanos: number;
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

// GetRateLimit
export interface GetRateLimitRequest {
  org_id: string;
}

export interface GetRateLimitResponse {
  org_id: string;
  billing_org_id: string;
  product_type: string;
  rate_limits: RateLimit[];
  product_sub_type?: string;
}

// SetRateLimit
export interface SetRateLimitRequest {
  org_id: string;
  requests_per_second: number;
  rule: string;
  rule_variant?: string;
  remediation: string;
  expires_at?: ProtoTimestamp;
  bucket_type: string;
  notes: string;
}

// RemoveRateLimit
export interface RemoveRateLimitRequest {
  org_id: string;
  rule: string;
  rule_variant?: string;
  bucket_type: string;
}

// GetDefaultRateLimits
export interface GetDefaultRateLimitsResponse {
  limits: RateLimit[];
}

// Interdictions
export interface Interdiction {
  key: string;
  owners: string[];
}

export interface GetInterdictionsRequest {
  org_id: string;
}

export interface GetInterdictionsResponse {
  interdictions: Interdiction[];
}

// SetInterdictorBlock
export interface SetInterdictorBlockRequest {
  scope: string;
  op: string;
  org_id: string;
  blocked: boolean;
  suborg_id?: string;
}

export interface SetInterdictorBlockResponse {
  raw_key: string;
  was_blocked: boolean;
}

// ClearCacheForOrg
export interface ClearCacheForOrgRequest {
  org_id: string;
  include_sub_orgs: boolean;
}

// EvaluateQuota
export interface EvaluateQuotaRequest {
  org_id: string;
  label: string;
}

// QuotaOverrides
export interface QuotaOverride {
  org_id: string;
  label: string;
  count: number;
}

export interface GetQuotaOverridesRequest {
  org_id: string;
}

export interface GetQuotaOverridesResponse {
  items: QuotaOverride[];
}

export interface SetQuotaOverrideRequest {
  data: QuotaOverride;
}

export interface RemoveQuotaOverrideRequest {
  org_id: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Migration wire types (mirror operator_agent.proto exactly)
//
// RBAC note: CheckMigration and GetPendingMigrations require the
// `migration:read` permission, which is restricted to engineering roles.
// The backend gateway and K8s RBAC enforce this — the UI does not need to
// implement its own RBAC check.
// ---------------------------------------------------------------------------

// CheckMigration
export interface CheckMigrationRequest {
  migration_id: string;
}

export interface CheckMigrationResponse {
  migration_id: string;
  applied: boolean;
}

// GetPendingMigrations
export interface GetPendingMigrationsRequest {
  /** Optional list of specific migration IDs to check; empty = all pending. */
  migration_ids: string[];
}

export interface GetPendingMigrationsResponse {
  results: CheckMigrationResponse[];
}
