import { Router, Request, Response, NextFunction } from 'express';
import { agentCall } from '../grpc/client';
import {
  DEFAULT_ENVIRONMENT,
  Environment,
  InvalidEnvironmentError,
  isEnvironment,
} from '../config/environments';
import {
  EmptyResponse,
  GetFeatureFlagResponse,
  ListFeatureFlagsResponse,
  toFeatureFlag,
} from '../grpc/types';

const router = Router();

// Rows whose enum value the agent can't name come back as the zero value. They
// carry distinct ids but no addressable name, so every route keyed on :flag
// would hit the same nonexistent flag — drop them from the list instead.
const UNNAMED_FLAG = 'FEATURE_FLAG_UNSPECIFIED';

// Backstop for deployments that don't populate FeatureFlagDefinition.is_deprecated.
const DEPRECATED_FLAGS = new Set([
  'FEATURE_FLAG_AUTH_PROXY',
  'FEATURE_FLAG_ACCOUNT_SETTINGS',
  'FEATURE_FLAG_CREATE_PRIVATE_KEY',
  'FEATURE_FLAG_OAUTH',
  'FEATURE_FLAG_SEND_EMAILS',
  'FEATURE_FLAG_SES_EMAIL',
  'FEATURE_FLAG_SUB_ORGS_UI',
]);

// Every route is scoped to one environment, chosen by ?env=. An unknown value
// is rejected rather than silently falling back, so a typo can't send a write
// to the wrong environment.
function envOf(req: Request): Environment {
  const value = req.query.env ?? DEFAULT_ENVIRONMENT;

  if (!isEnvironment(value)) {
    throw new InvalidEnvironmentError(String(value));
  }

  return value;
}

// The mutating RPCs return empty messages, so re-read the flag to hand the
// caller its new state.
async function readFlag(env: Environment, flag: string) {
  const response = await agentCall<{ flag: string }, GetFeatureFlagResponse>(
    env,
    'GetFeatureFlag',
    { flag }
  );
  return toFeatureFlag(response.flag);
}

// GET /api/flags → ListFeatureFlags
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await agentCall<object, ListFeatureFlagsResponse>(
      envOf(req),
      'ListFeatureFlags',
      {}
    );
    const flags = (response.flags || [])
      .filter(
        (f) =>
          f.flag &&
          f.flag !== UNNAMED_FLAG &&
          !f.is_deprecated &&
          !DEPRECATED_FLAGS.has(f.flag)
      )
      .map(toFeatureFlag);
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
      res.json({ flag: await readFlag(envOf(req), req.params.flag) });
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
      >(envOf(req), 'SetFeatureFlag', {
        flag: req.params.flag,
        enabled,
        rollout_percent,
      });
      res.json({ flag: await readFlag(envOf(req), req.params.flag) });
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
      >(envOf(req), 'AddFeatureFlagOrg', {
        flag: req.params.flag,
        org_id,
        enabled,
      });
      res.json({ flag: await readFlag(envOf(req), req.params.flag) });
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
        {
          flag: req.params.flag,
          org_id: req.params.org_id,
        }
      );
      res.json({ flag: await readFlag(envOf(req), req.params.flag) });
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
      >(envOf(req), 'AddFeatureFlagProduct', {
        flag: req.params.flag,
        product_type,
        product_sub_type: product_sub_type || 'PRODUCT_SUB_TYPE_UNSPECIFIED',
        enabled,
      });
      res.json({ flag: await readFlag(envOf(req), req.params.flag) });
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
      >(envOf(req), 'RemoveFeatureFlagProduct', {
        flag: req.params.flag,
        product_type: req.params.product_type,
        product_sub_type: req.params.product_sub_type,
      });
      res.json({ flag: await readFlag(envOf(req), req.params.flag) });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
