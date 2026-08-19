import { Router, Request, Response, NextFunction } from 'express';
import { grpcCall } from '../grpc/client';
import {
  ListFeatureFlagsResponse,
  GetFeatureFlagResponse,
  SetFeatureFlagResponse,
  AddFeatureFlagOrgResponse,
  RemoveFeatureFlagOrgResponse,
  AddFeatureFlagProductResponse,
  RemoveFeatureFlagProductResponse,
} from '../grpc/types';

const router = Router();

// Deprecated flags hidden from the UI
const DEPRECATED_FLAGS = new Set([
  'FEATURE_FLAG_AUTH_PROXY',
  'FEATURE_FLAG_ACCOUNT_SETTINGS',
  'FEATURE_FLAG_CREATE_PRIVATE_KEY',
  'FEATURE_FLAG_OAUTH',
  'FEATURE_FLAG_SEND_EMAILS',
  'FEATURE_FLAG_SES_EMAIL',
  'FEATURE_FLAG_SUB_ORGS_UI',
  'FEATURE_FLAG_APP_PROOFS',
]);

// GET /api/flags → ListFeatureFlags
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await grpcCall<object, ListFeatureFlagsResponse>(
      'ListFeatureFlags',
      {}
    );
    const flags = (response.flags || []).filter(
      (f) => !DEPRECATED_FLAGS.has(f.flag)
    );
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
      const response = await grpcCall<{ flag: string }, GetFeatureFlagResponse>(
        'GetFeatureFlag',
        { flag: req.params.flag }
      );
      res.json(response);
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
      const response = await grpcCall<
        { flag: string; enabled: boolean; rollout_percent: number },
        SetFeatureFlagResponse
      >('SetFeatureFlag', {
        flag: req.params.flag,
        enabled,
        rollout_percent,
      });
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/flags/:flag/orgs → AddFeatureFlagOrg
router.post(
  '/:flag/orgs',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { org_id, enabled } = req.body as {
        org_id: string;
        enabled: boolean;
      };
      const response = await grpcCall<
        { flag: string; org_id: string; enabled: boolean },
        AddFeatureFlagOrgResponse
      >('AddFeatureFlagOrg', {
        flag: req.params.flag,
        org_id,
        enabled,
      });
      res.json(response);
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
      const response = await grpcCall<
        { flag: string; org_id: string },
        RemoveFeatureFlagOrgResponse
      >('RemoveFeatureFlagOrg', {
        flag: req.params.flag,
        org_id: req.params.org_id,
      });
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/flags/:flag/products → AddFeatureFlagProduct
router.post(
  '/:flag/products',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { product_type, product_sub_type, enabled } = req.body as {
        product_type: number;
        product_sub_type: number;
        enabled: boolean;
      };
      const response = await grpcCall<
        {
          flag: string;
          product_type: number;
          product_sub_type: number;
          enabled: boolean;
        },
        AddFeatureFlagProductResponse
      >('AddFeatureFlagProduct', {
        flag: req.params.flag,
        product_type,
        product_sub_type,
        enabled,
      });
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/flags/:flag/products/:product_type/:product_sub_type → RemoveFeatureFlagProduct
router.delete(
  '/:flag/products/:product_type/:product_sub_type',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await grpcCall<
        { flag: string; product_type: number; product_sub_type: number },
        RemoveFeatureFlagProductResponse
      >('RemoveFeatureFlagProduct', {
        flag: req.params.flag,
        product_type: parseInt(req.params.product_type),
        product_sub_type: parseInt(req.params.product_sub_type),
      });
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
