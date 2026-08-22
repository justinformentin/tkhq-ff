import { Router } from 'express';
import { checkMigration, getPendingMigrations } from '../services/migrationOps';
import { callContext, handler } from './handler';

const router = Router();

// GET /api/migrations/pending → GetPendingMigrations
// Returns all migrations and their applied status.
// Engineering-only endpoint (migration:read group) — RBAC enforced by the
// OperatorAgentService via the forwarded X-ID-Token.
router.get(
  '/pending',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const result = await getPendingMigrations(env, idToken);
    res.json(result);
  })
);

// GET /api/migrations/:migrationId → CheckMigration
// Returns the applied status for a specific migration.
router.get(
  '/:migrationId',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const result = await checkMigration(
      env,
      req.params.migrationId.trim(),
      idToken
    );
    res.json(result);
  })
);

export default router;
