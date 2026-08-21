/**
 * Org Operations service — wraps OperatorAgentService RPCs that are keyed by
 * organization ID.  All calls mirror the flag service pattern: no enum
 * remapping, no silent env fallbacks, re-read after mutate.
 */

import { agentCall } from '../grpc/client';
import { Environment } from '../config/environments';
import {
  ClearCacheForOrgRequest,
  EmptyResponse,
  EvaluateQuotaRequest,
  GetDefaultRateLimitsResponse,
  GetInterdictionsRequest,
  GetInterdictionsResponse,
  GetQuotaOverridesRequest,
  GetQuotaOverridesResponse,
  GetRateLimitRequest,
  GetRateLimitResponse,
  OrgRefsRequest,
  OrgRefsResponse,
  QuotaOverride,
  RemoveQuotaOverrideRequest,
  RemoveRateLimitRequest,
  SetInterdictorBlockRequest,
  SetInterdictorBlockResponse,
  SetQuotaOverrideRequest,
  SetRateLimitRequest,
} from '../grpc/types';

// ---------------------------------------------------------------------------
// Org refs
// ---------------------------------------------------------------------------

export async function getOrgRefs(
  env: Environment,
  orgId: string,
  idToken: string
): Promise<OrgRefsResponse> {
  return agentCall<OrgRefsRequest, OrgRefsResponse>(
    env,
    'OrgRefs',
    { org_id: orgId },
    idToken
  );
}

// ---------------------------------------------------------------------------
// Rate limits
// ---------------------------------------------------------------------------

export async function getRateLimit(
  env: Environment,
  orgId: string,
  idToken: string
): Promise<GetRateLimitResponse> {
  return agentCall<GetRateLimitRequest, GetRateLimitResponse>(
    env,
    'GetRateLimit',
    { org_id: orgId },
    idToken
  );
}

export async function setRateLimit(
  env: Environment,
  req: SetRateLimitRequest,
  idToken: string
): Promise<GetRateLimitResponse> {
  await agentCall<SetRateLimitRequest, EmptyResponse>(
    env,
    'SetRateLimit',
    req,
    idToken
  );
  return getRateLimit(env, req.org_id, idToken);
}

export async function removeRateLimit(
  env: Environment,
  req: RemoveRateLimitRequest,
  idToken: string
): Promise<GetRateLimitResponse> {
  await agentCall<RemoveRateLimitRequest, EmptyResponse>(
    env,
    'RemoveRateLimit',
    req,
    idToken
  );
  return getRateLimit(env, req.org_id, idToken);
}

export async function getDefaultRateLimits(
  env: Environment,
  idToken: string
): Promise<GetDefaultRateLimitsResponse> {
  return agentCall<object, GetDefaultRateLimitsResponse>(
    env,
    'GetDefaultRateLimits',
    {},
    idToken
  );
}

// ---------------------------------------------------------------------------
// Interdictions
// ---------------------------------------------------------------------------

export async function getInterdictions(
  env: Environment,
  orgId: string,
  idToken: string
): Promise<GetInterdictionsResponse> {
  return agentCall<GetInterdictionsRequest, GetInterdictionsResponse>(
    env,
    'GetInterdictions',
    { org_id: orgId },
    idToken
  );
}

export async function setInterdictorBlock(
  env: Environment,
  req: SetInterdictorBlockRequest,
  idToken: string
): Promise<SetInterdictorBlockResponse> {
  return agentCall<SetInterdictorBlockRequest, SetInterdictorBlockResponse>(
    env,
    'SetInterdictorBlock',
    req,
    idToken
  );
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

export async function clearCacheForOrg(
  env: Environment,
  orgId: string,
  includeSubOrgs: boolean,
  idToken: string
): Promise<GetRateLimitResponse> {
  await agentCall<ClearCacheForOrgRequest, EmptyResponse>(
    env,
    'ClearCacheForOrg',
    { org_id: orgId, include_sub_orgs: includeSubOrgs },
    idToken
  );
  // Re-read to confirm cache refreshed
  return getRateLimit(env, orgId, idToken);
}

// ---------------------------------------------------------------------------
// EvaluateQuota (dry-run)
// ---------------------------------------------------------------------------

export async function evaluateQuota(
  env: Environment,
  orgId: string,
  label: string,
  idToken: string
): Promise<{ org_id: string; label: string; evaluated: true }> {
  await agentCall<EvaluateQuotaRequest, EmptyResponse>(
    env,
    'EvaluateQuota',
    { org_id: orgId, label },
    idToken
  );
  return { org_id: orgId, label, evaluated: true };
}

// ---------------------------------------------------------------------------
// Quota overrides
// ---------------------------------------------------------------------------

export async function getQuotaOverrides(
  env: Environment,
  orgId: string,
  idToken: string
): Promise<GetQuotaOverridesResponse> {
  return agentCall<GetQuotaOverridesRequest, GetQuotaOverridesResponse>(
    env,
    'GetQuotaOverrides',
    { org_id: orgId },
    idToken
  );
}

export async function setQuotaOverride(
  env: Environment,
  data: QuotaOverride,
  idToken: string
): Promise<GetQuotaOverridesResponse> {
  await agentCall<SetQuotaOverrideRequest, EmptyResponse>(
    env,
    'SetQuotaOverride',
    { data },
    idToken
  );
  return getQuotaOverrides(env, data.org_id, idToken);
}

export async function removeQuotaOverride(
  env: Environment,
  orgId: string,
  label: string,
  idToken: string
): Promise<GetQuotaOverridesResponse> {
  await agentCall<RemoveQuotaOverrideRequest, EmptyResponse>(
    env,
    'RemoveQuotaOverride',
    { org_id: orgId, label },
    idToken
  );
  return getQuotaOverrides(env, orgId, idToken);
}
