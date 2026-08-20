import { Router, Request, Response, NextFunction } from 'express';
import { agentCall } from '../grpc/client';
import { idTokenOf } from '../auth/identity';
import { EmptyResponse } from '../grpc/types';
import { listFlags, listFlagsWithOrgs, readFlag } from '../services/flags';
import { envOf } from './env';

const router = Router();

// GET /api/flags → ListFeatureFlags
// ?with_orgs=true re-reads every flag so the org override lists are filled in;
// the plain list leaves them empty. It costs one upstream call per flag, so
// it's opt-in.
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const env = envOf(req);
    const idToken = await idTokenOf(req);
    const flags =
      req.query.with_orgs === 'true'
        ? await listFlagsWithOrgs(env, idToken)
        : await listFlags(env, idToken);
    res.json({ flags });
  } catch (err) {
    next(err);
  }
});

// GET /api/flags/:flag → GetFeatureFlag
router.get(
  '/:flag',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ flag: await readFlag(envOf(req), req.params.flag, await idTokenOf(req)) });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/flags/:flag → SetFeatureFlag
router.put(
  '/:flag',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { enabled, rollout_percent } = req.body as {
        enabled: boolean;
        rollout_percent: number;
      };
      await agentCall<
        { flag: string; enabled: boolean; rollout_percent: number },
        EmptyResponse
      >(
        envOf(req),
        'SetFeatureFlag',
        { flag: req.params.flag, enabled, rollout_percent },
        await idTokenOf(req)
      );
      res.json({ flag: await readFlag(envOf(req), req.params.flag, await idTokenOf(req)) });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/flags/:flag/orgs → AddFeatureFlagOrg
// `enabled` picks the list: true whitelists the org, false blacklists it.
router.post(
  '/:flag/orgs',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { org_id, enabled } = req.body as {
        org_id: string;
        enabled: boolean;
      };
      await agentCall<
        { flag: string; org_id: string; enabled: boolean },
        EmptyResponse
      >(
        envOf(req),
        'AddFeatureFlagOrg',
        { flag: req.params.flag, org_id, enabled },
        await idTokenOf(req)
      );
      res.json({ flag: await readFlag(envOf(req), req.params.flag, await idTokenOf(req)) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/flags/:flag/orgs/:org_id → RemoveFeatureFlagOrg
router.delete(
  '/:flag/orgs/:org_id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await agentCall<{ flag: string; org_id: string }, EmptyResponse>(
        envOf(req),
        'RemoveFeatureFlagOrg',
        { flag: req.params.flag, org_id: req.params.org_id },
        await idTokenOf(req)
      );
      res.json({ flag: await readFlag(envOf(req), req.params.flag, await idTokenOf(req)) });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/flags/:flag/products → AddFeatureFlagProduct
// product_type / product_sub_type are proto enum names, e.g.
// "PRODUCT_TYPE_ENTERPRISE" / "PRODUCT_SUB_TYPE_ENTERPRISE_SCALE".
// PRODUCT_SUB_TYPE_UNSPECIFIED targets the whole product type.
router.post(
  '/:flag/products',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { product_type, product_sub_type, enabled } = req.body as {
        product_type: string;
        product_sub_type: string;
        enabled: boolean;
      };
      await agentCall<
        {
          flag: string;
          product_type: string;
          product_sub_type: string;
          enabled: boolean;
        },
        EmptyResponse
      >(
        envOf(req),
        'AddFeatureFlagProduct',
        {
          flag: req.params.flag,
          product_type,
          product_sub_type: product_sub_type || 'PRODUCT_SUB_TYPE_UNSPECIFIED',
          enabled,
        },
        await idTokenOf(req)
      );
      res.json({ flag: await readFlag(envOf(req), req.params.flag, await idTokenOf(req)) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/flags/:flag/products/:product_type/:product_sub_type
//   → RemoveFeatureFlagProduct
router.delete(
  '/:flag/products/:product_type/:product_sub_type',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await agentCall<
        { flag: string; product_type: string; product_sub_type: string },
        EmptyResponse
      >(
        envOf(req),
        'RemoveFeatureFlagProduct',
        {
          flag: req.params.flag,
          product_type: req.params.product_type,
          product_sub_type: req.params.product_sub_type,
        },
        await idTokenOf(req)
      );
      res.json({ flag: await readFlag(envOf(req), req.params.flag, await idTokenOf(req)) });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
