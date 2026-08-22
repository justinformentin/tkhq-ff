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
// Email / SES wire types (mirror operator_agent.proto exactly)
// ---------------------------------------------------------------------------

// Shared timestamp — reused from proto google.protobuf.Timestamp (longs: String)
// ProtoTimestamp is already declared above.

// SuppressionListReason enum names (enums: String)
export type SuppressionListReason =
  | 'SUPPRESSION_LIST_REASON_UNSPECIFIED'
  | 'SUPPRESSION_LIST_REASON_BOUNCE'
  | 'SUPPRESSION_LIST_REASON_COMPLAINT';

// SuppressedEmailSummary (list item)
export interface SuppressedEmailSummary {
  email_address: string;
  last_update_time?: ProtoTimestamp;
  reason: SuppressionListReason;
}

// SuppressedDestinationAttributes
export interface SuppressedDestinationAttributes {
  feedback_id: string;
  message_id: string;
}

// GetSuppressedEmail
export interface GetSuppressedEmailRequest {
  email_address: string;
}

export interface GetSuppressedEmailResponse {
  email_address: string;
  last_update_time?: ProtoTimestamp;
  reason: SuppressionListReason;
  attributes?: SuppressedDestinationAttributes;
}

// ListSuppressedEmails (paginated)
export interface ListSuppressedEmailsRequest {
  page_size?: number;
  next_token?: string;
  start_date?: ProtoTimestamp;
  end_date?: ProtoTimestamp;
  reasons?: SuppressionListReason[];
}

export interface ListSuppressedEmailsResponse {
  items: SuppressedEmailSummary[];
  next_token?: string;
}

// AddSuppressedEmail
export interface AddSuppressedEmailRequest {
  email_address: string;
  reason: SuppressionListReason;
}

export interface AddSuppressedEmailResponse {
  email_address: string;
  reason: SuppressionListReason;
}

// DeleteSuppressedEmail
export interface DeleteSuppressedEmailRequest {
  email_address: string;
}

export interface DeleteSuppressedEmailResponse {
  email_address: string;
}

// VerificationStatus enum names (enums: String)
export type VerificationStatus =
  | 'VERIFICATION_STATUS_UNSPECIFIED'
  | 'VERIFICATION_STATUS_PENDING'
  | 'VERIFICATION_STATUS_SUCCESS'
  | 'VERIFICATION_STATUS_FAILED'
  | 'VERIFICATION_STATUS_TEMPORARY_FAILURE'
  | 'VERIFICATION_STATUS_NOT_STARTED';

// DnsRecord
export interface DnsRecord {
  type: string;
  name: string;
  value: string;
  note: string;
}

// SesDomain response shape (shared across Get/Refresh/Create)
export interface SesDomainData {
  identity_name: string;
  configuration_set_name: string;
  tenant_names: string[];
  mail_from_domain: string;
  dns_records: DnsRecord[];
  verification_status: VerificationStatus;
  verified_for_sending: boolean;
  dkim_status: VerificationStatus;
  mail_from_domain_status: VerificationStatus;
}

// GetSesDomain
export interface GetSesDomainRequest {
  domain: string;
}

export type GetSesDomainResponse = SesDomainData;

// RefreshSesDomain
export interface RefreshSesDomainRequest {
  domain: string;
}

export type RefreshSesDomainResponse = SesDomainData;

// CreateSesDomain
export interface CreateSesDomainRequest {
  domain: string;
  configuration_set_name?: string;
  tenant_name?: string;
  mail_from_domain?: string;
}

export type CreateSesDomainResponse = SesDomainData;

// CreateCustomDomainEntry
export interface CreateCustomDomainEntryRequest {
  domain: string;
  org_id: string;
  tenant_name?: string;
}

export interface CreateCustomDomainEntryResponse {
  domain: string;
  org_id: string;
  tenant_name: string;
}

// UpdateAuthProxyEmailConfig
export interface UpdateAuthProxyEmailConfigRequest {
  org_id: string;
  send_from_email_address?: string;
  reply_to_email_address?: string;
  send_from_email_sender_name?: string;
}

export interface UpdateAuthProxyEmailConfigResponse {
  org_id: string;
  send_from_email_address?: string;
  reply_to_email_address?: string;
  send_from_email_sender_name?: string;
}

// GetEmailVerification
export interface GetEmailVerificationRequest {
  email: string;
}

export interface GetEmailVerificationResponse {
  email_address: string;
  valid: boolean;
  created_at?: ProtoTimestamp;
  updated_at?: ProtoTimestamp;
}

// UpdateEmailVerification
export interface UpdateEmailVerificationRequest {
  email: string;
  valid: boolean;
}

export interface UpdateEmailVerificationResponse {
  email_address: string;
  valid: boolean;
}
