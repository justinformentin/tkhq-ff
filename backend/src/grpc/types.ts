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
