import { Router } from 'express';
import { OrgRule } from '../grpc/types';
import { listFlagsWithOrgs } from '../services/flags';
import {
  clearCacheForOrg,
  evaluateQuota,
  getDefaultRateLimits,
  getInterdictions,
  getOrgRefs,
  getQuotaOverrides,
  getRateLimit,
  removeQuotaOverride,
  removeRateLimit,
  setInterdictorBlock,
  setQuotaOverride,
  setRateLimit,
} from '../services/orgOps';
import { callContext, handler } from './handler';

const router = Router();

// ---------------------------------------------------------------------------
// Existing: flag search by org
// ---------------------------------------------------------------------------

// GET /api/orgs/:org_id/flags
// Which flags carry an override for this org. Answered here rather than in the
// browser because it needs a GetFeatureFlag per flag — ListFeatureFlags leaves
// the org lists empty, so filtering the plain list client-side always found
// nothing.
router.get(
  '/:org_id/flags',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const orgId = req.params.org_id.trim();

    // Org ids are UUIDs; the agent's casing need not match what was pasted in.
    const wanted = orgId.toLowerCase();
    const listsOrg = (orgs: OrgRule[]) =>
      orgs.some((org) => org.org_id.toLowerCase() === wanted);

    const flags = await listFlagsWithOrgs(env, idToken);
    const matches = flags
      .map((flag) => ({
        flag,
        in_allowed: listsOrg(flag.allowed_orgs),
        in_disallowed: listsOrg(flag.disallowed_orgs),
      }))
      .filter((match) => match.in_allowed || match.in_disallowed);

    res.json({ org_id: orgId, matches });
  })
);

// ---------------------------------------------------------------------------
// New: Org Operations — Org Status (aggregate read)
// ---------------------------------------------------------------------------

// GET /api/orgs/:orgId/status
// Returns OrgRefs + GetRateLimit + GetInterdictions + GetQuotaOverrides in one
// response, giving the frontend a single fetch for the Org Status view.
router.get(
  '/:orgId/status',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const orgId = req.params.orgId.trim();

    const [refs, rateLimit, interdictions, quotas] = await Promise.all([
      getOrgRefs(env, orgId, idToken),
      getRateLimit(env, orgId, idToken),
      getInterdictions(env, orgId, idToken),
      getQuotaOverrides(env, orgId, idToken),
    ]);

    res.json({
      org_id: orgId,
      refs,
      rate_limit: rateLimit,
      interdictions,
      quotas,
    });
  })
);

// ---------------------------------------------------------------------------
// Rate Limits
// ---------------------------------------------------------------------------

// GET /api/orgs/:orgId/rate-limit → GetRateLimit
router.get(
  '/:orgId/rate-limit',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const result = await getRateLimit(env, req.params.orgId.trim(), idToken);
    res.json(result);
  })
);

// PUT /api/orgs/:orgId/rate-limit → SetRateLimit (re-reads after write)
router.put(
  '/:orgId/rate-limit',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const orgId = req.params.orgId.trim();
    const {
      requests_per_second,
      rule,
      rule_variant,
      remediation,
      expires_at,
      bucket_type,
      notes,
    } = req.body as {
      requests_per_second: number;
      rule: string;
      rule_variant?: string;
      remediation: string;
      expires_at?: { seconds: string; nanos: number };
      bucket_type: string;
      notes: string;
    };

    const result = await setRateLimit(
      env,
      {
        org_id: orgId,
        requests_per_second,
        rule,
        rule_variant,
        remediation,
        expires_at,
        bucket_type,
        notes,
      },
      idToken
    );
    res.json(result);
  })
);

// DELETE /api/orgs/:orgId/rate-limit → RemoveRateLimit (re-reads after delete)
router.delete(
  '/:orgId/rate-limit',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const orgId = req.params.orgId.trim();
    const { rule, rule_variant, bucket_type } = req.body as {
      rule: string;
      rule_variant?: string;
      bucket_type: string;
    };

    const result = await removeRateLimit(
      env,
      { org_id: orgId, rule, rule_variant, bucket_type },
      idToken
    );
    res.json(result);
  })
);

// ---------------------------------------------------------------------------
// Interdictions
// ---------------------------------------------------------------------------

// GET /api/orgs/:orgId/interdictions → GetInterdictions
router.get(
  '/:orgId/interdictions',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const result = await getInterdictions(
      env,
      req.params.orgId.trim(),
      idToken
    );
    res.json(result);
  })
);

// POST /api/orgs/:orgId/interdictions → SetInterdictorBlock (set or remove)
router.post(
  '/:orgId/interdictions',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const orgId = req.params.orgId.trim();
    const { scope, op, blocked, suborg_id } = req.body as {
      scope: string;
      op: string;
      blocked: boolean;
      suborg_id?: string;
    };

    const result = await setInterdictorBlock(
      env,
      { scope, op, org_id: orgId, blocked, suborg_id },
      idToken
    );
    res.json(result);
  })
);

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

// POST /api/orgs/:orgId/cache/clear → ClearCacheForOrg
router.post(
  '/:orgId/cache/clear',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const orgId = req.params.orgId.trim();
    const { include_sub_orgs = false } = req.body as {
      include_sub_orgs?: boolean;
    };
    const result = await clearCacheForOrg(
      env,
      orgId,
      include_sub_orgs,
      idToken
    );
    res.json(result);
  })
);

// ---------------------------------------------------------------------------
// Quota (dry-run evaluate)
// ---------------------------------------------------------------------------

// POST /api/orgs/:orgId/quota/evaluate → EvaluateQuota (dry-run)
router.post(
  '/:orgId/quota/evaluate',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const orgId = req.params.orgId.trim();
    const { label } = req.body as { label: string };
    const result = await evaluateQuota(env, orgId, label, idToken);
    res.json(result);
  })
);

// ---------------------------------------------------------------------------
// Quota Overrides
// ---------------------------------------------------------------------------

// GET /api/orgs/:orgId/quotas → GetQuotaOverrides
router.get(
  '/:orgId/quotas',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const result = await getQuotaOverrides(
      env,
      req.params.orgId.trim(),
      idToken
    );
    res.json(result);
  })
);

// PUT /api/orgs/:orgId/quotas → SetQuotaOverride (re-reads after write)
router.put(
  '/:orgId/quotas',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const orgId = req.params.orgId.trim();
    const { label, count } = req.body as { label: string; count: number };
    const result = await setQuotaOverride(
      env,
      { org_id: orgId, label, count },
      idToken
    );
    res.json(result);
  })
);

// DELETE /api/orgs/:orgId/quotas/:label → RemoveQuotaOverride (re-reads after delete)
router.delete(
  '/:orgId/quotas/:label',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const result = await removeQuotaOverride(
      env,
      req.params.orgId.trim(),
      req.params.label,
      idToken
    );
    res.json(result);
  })
);

// ---------------------------------------------------------------------------
// Default Rate Limits (not org-specific)
// ---------------------------------------------------------------------------

export default router;
