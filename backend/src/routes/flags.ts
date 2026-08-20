import { Request, Response, Router } from 'express';
import { agentCall } from '../grpc/client';
import { EmptyResponse } from '../grpc/types';
import { listFlags, listFlagsWithOrgs, readFlag } from '../services/flags';
import { CallContext, callContext, handler } from './handler';

const router = Router();

/**
 * Sends one mutating call and answers with the flag as it now stands.
 *
 * Every mutation returns an empty message, so the fresh state has to be
 * re-read — which is also what confirms the agent stored what we sent.
 */
async function mutateFlag<TRequest extends object>(
  req: Request,
  res: Response,
  method: string,
  request: TRequest
): Promise<void> {
  const context = await callContext(req);

  await agentCall<TRequest, EmptyResponse>(
    context.env,
    method,
    request,
    context.idToken
  );

  await respondWithFlag(res, context, req.params.flag);
}

async function respondWithFlag(
  res: Response,
  { env, idToken }: CallContext,
  flag: string
): Promise<void> {
  res.json({ flag: await readFlag(env, flag, idToken) });
}

// GET /api/flags → ListFeatureFlags
// ?with_orgs=true re-reads every flag so the org override lists are filled in;
// the plain list leaves them empty. It costs one upstream call per flag, so
// it's opt-in.
router.get(
  '/',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const withOrgs = req.query.with_orgs === 'true';

    const flags = withOrgs
      ? await listFlagsWithOrgs(env, idToken)
      : await listFlags(env, idToken);

    res.json({ flags });
  })
);

// GET /api/flags/:flag → GetFeatureFlag
router.get(
  '/:flag',
  handler(async (req, res) => {
    const context = await callContext(req);
    await respondWithFlag(res, context, req.params.flag);
  })
);

// PUT /api/flags/:flag → SetFeatureFlag
router.put(
  '/:flag',
  handler(async (req, res) => {
    const { enabled, rollout_percent } = req.body as {
      enabled: boolean;
      rollout_percent: number;
    };

    await mutateFlag(req, res, 'SetFeatureFlag', {
      flag: req.params.flag,
      enabled,
      rollout_percent,
    });
  })
);

// POST /api/flags/:flag/orgs → AddFeatureFlagOrg
// `enabled` picks the list: true whitelists the org, false blacklists it.
router.post(
  '/:flag/orgs',
  handler(async (req, res) => {
    const { org_id, enabled } = req.body as {
      org_id: string;
      enabled: boolean;
    };

    await mutateFlag(req, res, 'AddFeatureFlagOrg', {
      flag: req.params.flag,
      org_id,
      enabled,
    });
  })
);

// DELETE /api/flags/:flag/orgs/:org_id → RemoveFeatureFlagOrg
router.delete(
  '/:flag/orgs/:org_id',
  handler(async (req, res) => {
    await mutateFlag(req, res, 'RemoveFeatureFlagOrg', {
      flag: req.params.flag,
      org_id: req.params.org_id,
    });
  })
);

// POST /api/flags/:flag/products → AddFeatureFlagProduct
// product_type / product_sub_type are proto enum names, e.g.
// "PRODUCT_TYPE_ENTERPRISE" / "PRODUCT_SUB_TYPE_ENTERPRISE_SCALE".
// PRODUCT_SUB_TYPE_UNSPECIFIED targets the whole product type.
router.post(
  '/:flag/products',
  handler(async (req, res) => {
    const { product_type, product_sub_type, enabled } = req.body as {
      product_type: string;
      product_sub_type: string;
      enabled: boolean;
    };

    await mutateFlag(req, res, 'AddFeatureFlagProduct', {
      flag: req.params.flag,
      product_type,
      product_sub_type: product_sub_type || 'PRODUCT_SUB_TYPE_UNSPECIFIED',
      enabled,
    });
  })
);

// DELETE /api/flags/:flag/products/:product_type/:product_sub_type
//   → RemoveFeatureFlagProduct
router.delete(
  '/:flag/products/:product_type/:product_sub_type',
  handler(async (req, res) => {
    await mutateFlag(req, res, 'RemoveFeatureFlagProduct', {
      flag: req.params.flag,
      product_type: req.params.product_type,
      product_sub_type: req.params.product_sub_type,
    });
  })
);

export default router;
