import axios from 'axios';
import type {
  CheckMigrationResponse,
  AddSuppressedEmailResponse,
  DeleteSuppressedEmailResponse,
  FeatureFlag,
  GetDefaultRateLimitsResponse,
  GetEmailVerificationResponse,
  GetInterdictionsResponse,
  GetPendingMigrationsResponse,
  GetQuotaOverridesResponse,
  GetRateLimitResponse,
  GetSuppressedEmailResponse,
  ListFlagsResponse,
  GetFlagResponse,
  ListSuppressedEmailsResponse,
  OrgFlagMatch,
  OrgSearchResponse,
  OrgStatusResponse,
  SesDomainResponse,
  SetInterdictorBlockResponse,
  SuppressionListReason,
  UpdateEmailVerificationResponse,
} from '../types';
import type { Environment } from './environment';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  // The session lives in an httpOnly cookie when the backend runs in oidc mode.
  withCredentials: true,
});

export interface Identity {
  /** 'session' = signed in here; 'tkinfra' = borrowed from the CLI's cache. */
  source: 'session' | 'tkinfra';
  user: { username?: string; email?: string; name?: string };
}

export async function getIdentity(): Promise<Identity> {
  const res = await api.get<Identity>('/auth/me');
  return res.data;
}

export async function logout(): Promise<string | null> {
  const res = await api.post<{ logoutUrl: string | null }>('/auth/logout');
  return res.data.logoutUrl;
}

// Every request names the environment it targets; the backend rejects
// anything it doesn't recognize rather than guessing.
function forEnv(env: Environment) {
  return { params: { env } };
}

// The upstream list RPC leaves every flag's org lists empty, so anything that
// renders override counts has to ask for `with_orgs` — it costs the backend one
// extra read per flag.
export async function listFlags(
  env: Environment,
  withOrgs = false
): Promise<FeatureFlag[]> {
  const res = await api.get<ListFlagsResponse>('/flags', {
    params: { env, ...(withOrgs ? { with_orgs: 'true' } : {}) },
  });
  return res.data.flags;
}

// Org overrides are only populated by the per-flag read, so this search runs
// on the backend rather than by filtering the flag list here.
export async function searchOrg(
  org_id: string,
  env: Environment
): Promise<OrgFlagMatch[]> {
  const res = await api.get<OrgSearchResponse>(
    `/orgs/${encodeURIComponent(org_id)}/flags`,
    forEnv(env)
  );
  return res.data.matches;
}

export async function getFlag(
  flag: string,
  env: Environment
): Promise<FeatureFlag> {
  const res = await api.get<GetFlagResponse>(`/flags/${flag}`, forEnv(env));
  return res.data.flag;
}

export async function setFlag(
  flag: string,
  env: Environment,
  enabled: boolean,
  rollout_percent: number
): Promise<FeatureFlag> {
  const res = await api.put<GetFlagResponse>(
    `/flags/${flag}`,
    { enabled, rollout_percent },
    forEnv(env)
  );
  return res.data.flag;
}

export async function addFlagOrg(
  flag: string,
  env: Environment,
  org_id: string,
  enabled: boolean
): Promise<FeatureFlag> {
  const res = await api.post<GetFlagResponse>(
    `/flags/${flag}/orgs`,
    { org_id, enabled },
    forEnv(env)
  );
  return res.data.flag;
}

export async function removeFlagOrg(
  flag: string,
  env: Environment,
  org_id: string
): Promise<FeatureFlag> {
  const res = await api.delete<GetFlagResponse>(
    `/flags/${flag}/orgs/${org_id}`,
    forEnv(env)
  );
  return res.data.flag;
}

export async function addFlagProduct(
  flag: string,
  env: Environment,
  product_type: string,
  product_sub_type: string,
  enabled: boolean
): Promise<FeatureFlag> {
  const res = await api.post<GetFlagResponse>(
    `/flags/${flag}/products`,
    { product_type, product_sub_type, enabled },
    forEnv(env)
  );
  return res.data.flag;
}

export async function removeFlagProduct(
  flag: string,
  env: Environment,
  product_type: string,
  product_sub_type: string
): Promise<FeatureFlag> {
  const res = await api.delete<GetFlagResponse>(
    `/flags/${flag}/products/${product_type}/${product_sub_type}`,
    forEnv(env)
  );
  return res.data.flag;
}

// ---------------------------------------------------------------------------
// Org Operations API
// ---------------------------------------------------------------------------

/** Aggregate status: OrgRefs + RateLimit + Interdictions + Quotas */
export async function getOrgStatus(
  orgId: string,
  env: Environment
): Promise<OrgStatusResponse> {
  const res = await api.get<OrgStatusResponse>(
    `/orgs/${encodeURIComponent(orgId)}/status`,
    forEnv(env)
  );
  return res.data;
}

/** GetRateLimit */
export async function getOrgRateLimit(
  orgId: string,
  env: Environment
): Promise<GetRateLimitResponse> {
  const res = await api.get<GetRateLimitResponse>(
    `/orgs/${encodeURIComponent(orgId)}/rate-limit`,
    forEnv(env)
  );
  return res.data;
}

/** SetRateLimit — returns fresh rate limit after write */
export async function setOrgRateLimit(
  orgId: string,
  env: Environment,
  body: {
    requests_per_second: number;
    rule: string;
    rule_variant?: string;
    remediation: string;
    bucket_type: string;
    notes: string;
  }
): Promise<GetRateLimitResponse> {
  const res = await api.put<GetRateLimitResponse>(
    `/orgs/${encodeURIComponent(orgId)}/rate-limit`,
    body,
    forEnv(env)
  );
  return res.data;
}

/** RemoveRateLimit — returns fresh rate limit after delete */
export async function removeOrgRateLimit(
  orgId: string,
  env: Environment,
  body: { rule: string; rule_variant?: string; bucket_type: string }
): Promise<GetRateLimitResponse> {
  const res = await api.delete<GetRateLimitResponse>(
    `/orgs/${encodeURIComponent(orgId)}/rate-limit`,
    { ...forEnv(env), data: body }
  );
  return res.data;
}

/** GetDefaultRateLimits */
export async function getDefaultRateLimits(
  env: Environment
): Promise<GetDefaultRateLimitsResponse> {
  const res = await api.get<GetDefaultRateLimitsResponse>(
    '/rate-limits/defaults',
    forEnv(env)
  );
  return res.data;
}

/** GetInterdictions */
export async function getOrgInterdictions(
  orgId: string,
  env: Environment
): Promise<GetInterdictionsResponse> {
  const res = await api.get<GetInterdictionsResponse>(
    `/orgs/${encodeURIComponent(orgId)}/interdictions`,
    forEnv(env)
  );
  return res.data;
}

/** SetInterdictorBlock (set or remove a block) */
export async function setOrgInterdictorBlock(
  orgId: string,
  env: Environment,
  body: { scope: string; op: string; blocked: boolean; suborg_id?: string }
): Promise<SetInterdictorBlockResponse> {
  const res = await api.post<SetInterdictorBlockResponse>(
    `/orgs/${encodeURIComponent(orgId)}/interdictions`,
    body,
    forEnv(env)
  );
  return res.data;
}

/** ClearCacheForOrg */
export async function clearOrgCache(
  orgId: string,
  env: Environment,
  includeSubOrgs = false
): Promise<GetRateLimitResponse> {
  const res = await api.post<GetRateLimitResponse>(
    `/orgs/${encodeURIComponent(orgId)}/cache/clear`,
    { include_sub_orgs: includeSubOrgs },
    forEnv(env)
  );
  return res.data;
}

/** EvaluateQuota (dry-run) */
export async function evaluateOrgQuota(
  orgId: string,
  env: Environment,
  label: string
): Promise<{ org_id: string; label: string; evaluated: boolean }> {
  const res = await api.post<{
    org_id: string;
    label: string;
    evaluated: boolean;
  }>(
    `/orgs/${encodeURIComponent(orgId)}/quota/evaluate`,
    { label },
    forEnv(env)
  );
  return res.data;
}

/** GetQuotaOverrides */
export async function getOrgQuotas(
  orgId: string,
  env: Environment
): Promise<GetQuotaOverridesResponse> {
  const res = await api.get<GetQuotaOverridesResponse>(
    `/orgs/${encodeURIComponent(orgId)}/quotas`,
    forEnv(env)
  );
  return res.data;
}

/** SetQuotaOverride — returns fresh quota list after write */
export async function setOrgQuota(
  orgId: string,
  env: Environment,
  label: string,
  count: number
): Promise<GetQuotaOverridesResponse> {
  const res = await api.put<GetQuotaOverridesResponse>(
    `/orgs/${encodeURIComponent(orgId)}/quotas`,
    { label, count },
    forEnv(env)
  );
  return res.data;
}

/** RemoveQuotaOverride — returns fresh quota list after delete */
export async function removeOrgQuota(
  orgId: string,
  env: Environment,
  label: string
): Promise<GetQuotaOverridesResponse> {
  const res = await api.delete<GetQuotaOverridesResponse>(
    `/orgs/${encodeURIComponent(orgId)}/quotas/${encodeURIComponent(label)}`,
    forEnv(env)
  );
  return res.data;
}

// ---------------------------------------------------------------------------
// Migrations API
//
// RBAC note: these endpoints require `migration:read` (engineering-only).
// Enforcement is handled by the backend gateway and K8s RBAC.
// ---------------------------------------------------------------------------

/** GetPendingMigrations — lists pending migrations.
 *  Pass an optional array of specific migration IDs to narrow the check. */
export async function getPendingMigrations(
  env: Environment,
  migrationIds: string[] = []
): Promise<GetPendingMigrationsResponse> {
  const params: Record<string, string> = { env };
  if (migrationIds.length > 0) {
    params.ids = migrationIds.join(',');
  }
  const res = await api.get<GetPendingMigrationsResponse>(
    '/migrations/pending',
    {
      params,
    }
  );
  return res.data;
}

/** CheckMigration — check whether a specific migration has been applied. */
export async function checkMigration(
  migrationId: string,
  env: Environment
): Promise<CheckMigrationResponse> {
  const res = await api.get<CheckMigrationResponse>(
    `/migrations/${encodeURIComponent(migrationId)}/check`,
    forEnv(env)
  );
  return res.data;
}

// Email / SES API
// ---------------------------------------------------------------------------

/** ListSuppressedEmails — paginated */
export async function listSuppressedEmails(
  env: Environment,
  opts: {
    page_size?: number;
    next_token?: string;
    reasons?: SuppressionListReason[];
  } = {}
): Promise<ListSuppressedEmailsResponse> {
  const params: Record<string, string | number | string[]> = { env };
  if (opts.page_size !== undefined) params.page_size = opts.page_size;
  if (opts.next_token) params.next_token = opts.next_token;
  if (opts.reasons && opts.reasons.length > 0)
    params.reasons = opts.reasons.join(',');
  const res = await api.get<ListSuppressedEmailsResponse>(
    '/email/suppressions',
    { params }
  );
  return res.data;
}

/** GetSuppressedEmail — look up one address */
export async function getSuppressedEmail(
  emailAddress: string,
  env: Environment
): Promise<GetSuppressedEmailResponse> {
  const res = await api.get<GetSuppressedEmailResponse>(
    `/email/suppressions/${encodeURIComponent(emailAddress)}`,
    forEnv(env)
  );
  return res.data;
}

/** AddSuppressedEmail */
export async function addSuppressedEmail(
  env: Environment,
  email_address: string,
  reason: SuppressionListReason
): Promise<AddSuppressedEmailResponse> {
  const res = await api.post<AddSuppressedEmailResponse>(
    '/email/suppressions',
    { email_address, reason },
    forEnv(env)
  );
  return res.data;
}

/** DeleteSuppressedEmail */
export async function deleteSuppressedEmail(
  emailAddress: string,
  env: Environment
): Promise<DeleteSuppressedEmailResponse> {
  const res = await api.delete<DeleteSuppressedEmailResponse>(
    `/email/suppressions/${encodeURIComponent(emailAddress)}`,
    forEnv(env)
  );
  return res.data;
}

/** GetSesDomain */
export async function getSesDomain(
  domain: string,
  env: Environment
): Promise<SesDomainResponse> {
  const res = await api.get<SesDomainResponse>('/email/ses-domain', {
    params: { env, domain },
  });
  return res.data;
}

/** RefreshSesDomain */
export async function refreshSesDomain(
  domain: string,
  env: Environment
): Promise<SesDomainResponse> {
  const res = await api.post<SesDomainResponse>(
    '/email/ses-domain/refresh',
    { domain },
    forEnv(env)
  );
  return res.data;
}

/** CreateSesDomain */
export async function createSesDomain(
  env: Environment,
  body: {
    domain: string;
    configuration_set_name?: string;
    tenant_name?: string;
    mail_from_domain?: string;
  }
): Promise<SesDomainResponse> {
  const res = await api.post<SesDomainResponse>(
    '/email/ses-domain',
    body,
    forEnv(env)
  );
  return res.data;
}

/** GetEmailVerification */
export async function getEmailVerification(
  email: string,
  env: Environment
): Promise<GetEmailVerificationResponse> {
  const res = await api.get<GetEmailVerificationResponse>(
    '/email/verification',
    { params: { env, email } }
  );
  return res.data;
}

/** UpdateEmailVerification */
export async function updateEmailVerification(
  env: Environment,
  email: string,
  valid: boolean
): Promise<UpdateEmailVerificationResponse> {
  const res = await api.put<UpdateEmailVerificationResponse>(
    '/email/verification',
    { email, valid },
    forEnv(env)
  );
  return res.data;
}
