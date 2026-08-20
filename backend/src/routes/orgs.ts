import { Router } from 'express';
import { OrgRule } from '../grpc/types';
import { listFlagsWithOrgs } from '../services/flags';
import { callContext, handler } from './handler';

const router = Router();

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

export default router;
