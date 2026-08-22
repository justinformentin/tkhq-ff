/**
 * Service Control routes — engineering-only endpoints for scaling Kubernetes
 * deployments and directing traffic weights.
 *
 * These routes are intentionally kept minimal: no re-read after write (both
 * RPCs return empty), just a 200 OK on success or a propagated error.
 *
 * Endpoint paths follow the same /api/<resource>/<action> pattern used
 * elsewhere in this backend.
 */

import { Router } from 'express';
import { scaleService, directService } from '../services/serviceControlOps';
import { callContext, handler } from './handler';

const router = Router();

// POST /api/service-control/scale
// Body: { service_name: string; replicas: number; environment: string }
// Calls ScaleService — scales a Kubernetes deployment to the given replica count.
router.post(
  '/scale',
  handler(async (req, res) => {
    const { service_name, replicas, environment } = req.body as {
      service_name: string;
      replicas: number;
      environment: string;
    };

    const { env, idToken } = await callContext(req);

    await scaleService(env, service_name, replicas, environment, idToken);

    res.json({ ok: true, service_name, replicas, environment });
  })
);

// POST /api/service-control/direct
// Body: { service_name: string; traffic_weight: number; environment: string }
// Calls DirectService — sets the traffic weight for a named service.
router.post(
  '/direct',
  handler(async (req, res) => {
    const { service_name, traffic_weight, environment } = req.body as {
      service_name: string;
      traffic_weight: number;
      environment: string;
    };

    const { env, idToken } = await callContext(req);

    await directService(env, service_name, traffic_weight, environment, idToken);

    res.json({ ok: true, service_name, traffic_weight, environment });
  })
);

export default router;
