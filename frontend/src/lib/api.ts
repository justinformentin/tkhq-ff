import axios from 'axios';
import type {
  FeatureFlag,
  GetDefaultRateLimitsResponse,
  GetInterdictionsResponse,
  GetQuotaOverridesResponse,
  GetRateLimitResponse,
  ListFlagsResponse,
  GetFlagResponse,
  OrgFlagMatch,
  OrgSearchResponse,
  OrgStatusResponse,
  SetInterdictorBlockResponse,
  ScaleServiceResponse,
  DirectServiceResponse,
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
// Service Control API — DESTRUCTIVE, engineering-only
// Wraps ScaleService and DirectService OperatorAgentService RPCs.
// Requires service:admin RBAC.
// ---------------------------------------------------------------------------

/**
 * ScaleService — scale a Kubernetes deployment's replica count.
 *
 * @param service     Kubernetes deployment/service name (e.g. "api-server")
 * @param env         Which operator agent to call (agent-env routing)
 * @param body.replicas    Target replica count (>= 0)
 * @param body.environment Proto enum name for the k8s cluster/env
 *                         (e.g. "ENVIRONMENT_PRODUCTION")
 */
export async function scaleService(
  service: string,
  env: Environment,
  body: { replicas: number; environment: string }
): Promise<ScaleServiceResponse> {
  const res = await api.post<ScaleServiceResponse>(
    `/services/${encodeURIComponent(service)}/scale`,
    body,
    forEnv(env)
  );
  return res.data;
}

/**
 * DirectService — redirect traffic for a Kubernetes service.
 *
 * @param service     Kubernetes deployment/service name (e.g. "api-server")
 * @param env         Which operator agent to call (agent-env routing)
 * @param body.direction   Traffic direction target (e.g. "canary", "stable")
 * @param body.environment Proto enum name for the environment
 */
export async function directService(
  service: string,
  env: Environment,
  body: { direction: string; environment: string }
): Promise<DirectServiceResponse> {
  const res = await api.post<DirectServiceResponse>(
    `/services/${encodeURIComponent(service)}/direct`,
    body,
    forEnv(env)
  );
  return res.data;
}
