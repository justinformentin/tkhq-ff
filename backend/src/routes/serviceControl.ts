/**
 * Service Control routes — destructive, engineering-only endpoints.
 *
 * These routes wrap OperatorAgentService RPCs that scale Kubernetes
 * deployments and redirect traffic per-environment. They require
 * `service:admin` RBAC and must NEVER be exposed to non-engineering users.
 *
 * All mutations are POST-only (never idempotent PUT/PATCH) to make
 * accidental calls harder and to mirror the proto's RPC semantics.
 *
 * Pattern mirrors routes/orgs.ts exactly.
 */

import { Router } from 'express';
import { scaleService, directService } from '../services/serviceControl';
import { callContext, handler } from './handler';

const router = Router();

// ---------------------------------------------------------------------------
// ScaleService — POST /api/services/:service/scale
//
// Adjusts the replica count of a Kubernetes deployment.
// Body: { replicas: number, environment: string }
//   replicas    — target replica count (>= 0)
//   environment — proto enum name for which k8s cluster/env to target
//                 (e.g. "ENVIRONMENT_PRODUCTION")
// ---------------------------------------------------------------------------

router.post(
  '/:service/scale',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const service = req.params.service.trim();
    const { replicas, environment } = req.body as {
      replicas: number;
      environment: string;
    };

    if (typeof replicas !== 'number' || replicas < 0) {
      res.status(400).json({ error: 'replicas must be a non-negative number' });
      return;
    }
    if (!environment || typeof environment !== 'string') {
      res.status(400).json({ error: 'environment is required' });
      return;
    }

    const result = await scaleService(
      env,
      service,
      replicas,
      environment,
      idToken
    );
    res.json(result);
  })
);

// ---------------------------------------------------------------------------
// DirectService — POST /api/services/:service/direct
//
// Redirects (directs) traffic for a Kubernetes service.
// Body: { direction: string, environment: string }
//   direction   — traffic direction target (e.g. "canary", "stable")
//   environment — proto enum name for the environment
// ---------------------------------------------------------------------------

router.post(
  '/:service/direct',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const service = req.params.service.trim();
    const { direction, environment } = req.body as {
      direction: string;
      environment: string;
    };

    if (!direction || typeof direction !== 'string') {
      res.status(400).json({ error: 'direction is required' });
      return;
    }
    if (!environment || typeof environment !== 'string') {
      res.status(400).json({ error: 'environment is required' });
      return;
    }

    const result = await directService(
      env,
      service,
      direction,
      environment,
      idToken
    );
    res.json(result);
  })
);

export default router;
