/**
 * Rate-limit routes that are not scoped to a single org.
 */
import { Router } from 'express';
import { getDefaultRateLimits } from '../services/orgOps';
import { callContext, handler } from './handler';

const router = Router();

// GET /api/rate-limits/defaults → GetDefaultRateLimits
router.get(
  '/defaults',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const result = await getDefaultRateLimits(env, idToken);
    res.json(result);
  })
);

export default router;
