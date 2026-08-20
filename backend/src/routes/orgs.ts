import { Router, Request, Response, NextFunction } from 'express';
import { listFlagsWithOrgs } from '../services/flags';
import { envOf } from './env';
import { idTokenOf } from '../auth/identity';

const router = Router();

// GET /api/orgs/:org_id/flags
// Which flags carry an override for this org. Answered here rather than in the
// browser because it needs a GetFeatureFlag per flag — ListFeatureFlags leaves
// the org lists empty, so filtering the plain list client-side always found
// nothing.
router.get(
  '/:org_id/flags',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Org ids are UUIDs; the agent's casing need not match what was pasted in.
      const orgId = req.params.org_id.trim().toLowerCase();
      const matches = (await listFlagsWithOrgs(envOf(req), await idTokenOf(req)))
        .map((flag) => ({
          flag,
          in_allowed: flag.allowed_orgs.some(
            (o) => o.org_id.toLowerCase() === orgId
          ),
          in_disallowed: flag.disallowed_orgs.some(
            (o) => o.org_id.toLowerCase() === orgId
          ),
        }))
        .filter((m) => m.in_allowed || m.in_disallowed);

      res.json({ org_id: req.params.org_id.trim(), matches });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
