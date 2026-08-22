/**
 * Migration routes — REST endpoints backed by OperatorAgentService RPCs.
 *
 * RBAC note: CheckMigration and GetPendingMigrations require the
 * `migration:read` permission, which is restricted to engineering roles.
 * The backend gateway and K8s RBAC enforce this — the UI does not need to
 * implement its own RBAC check.
 */

import { Router } from 'express';
import { checkMigration, getPendingMigrations } from '../services/migrations';
import { callContext, handler } from './handler';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/migrations/pending → GetPendingMigrations
//
// Optional query param `ids` is a comma-separated list of migration IDs to
// scope the check. Omit (or pass empty) to list all pending migrations.
// ---------------------------------------------------------------------------

router.get(
  '/pending',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const rawIds = req.query.ids as string | undefined;
    const migrationIds = rawIds
      ? rawIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const result = await getPendingMigrations(env, migrationIds, idToken);
    res.json(result);
  })
);

// ---------------------------------------------------------------------------
// GET /api/migrations/:id/check → CheckMigration
// ---------------------------------------------------------------------------

router.get(
  '/:id/check',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const migrationId = req.params.id.trim();

    const result = await checkMigration(env, migrationId, idToken);
    res.json(result);
  })
);

export default router;
