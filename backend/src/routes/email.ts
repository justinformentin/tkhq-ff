import { Router } from 'express';
import { SuppressionListReason } from '../grpc/types';
import {
  addSuppressedEmail,
  createCustomDomainEntry,
  createSesDomain,
  deleteSuppressedEmail,
  getEmailVerification,
  getSesDomain,
  getSuppressedEmail,
  listSuppressedEmails,
  refreshSesDomain,
  updateAuthProxyEmailConfig,
  updateEmailVerification,
} from '../services/email';
import { callContext, handler } from './handler';

const router = Router();

// ---------------------------------------------------------------------------
// Email Suppression
// ---------------------------------------------------------------------------

// GET /api/email/suppressions
// → ListSuppressedEmails (paginated).  Pagination params:
//   ?page_size=25&next_token=<token>&reasons=SUPPRESSION_LIST_REASON_BOUNCE,...
router.get(
  '/suppressions',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);

    const pageSize = req.query.page_size
      ? Number(req.query.page_size)
      : undefined;
    const nextToken =
      typeof req.query.next_token === 'string' && req.query.next_token
        ? req.query.next_token
        : undefined;

    // reasons may be passed as a comma-separated string or repeated query params
    let reasons: SuppressionListReason[] | undefined;
    const reasonsRaw = req.query.reasons;
    if (reasonsRaw) {
      const raw = Array.isArray(reasonsRaw) ? reasonsRaw : [reasonsRaw];
      const flat = raw.flatMap((r) =>
        typeof r === 'string' ? r.split(',') : []
      );
      if (flat.length > 0) {
        reasons = flat as SuppressionListReason[];
      }
    }

    const result = await listSuppressedEmails(
      env,
      { page_size: pageSize, next_token: nextToken, reasons },
      idToken
    );
    res.json(result);
  })
);

// GET /api/email/suppressions/:email → GetSuppressedEmail
router.get(
  '/suppressions/:email',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const emailAddress = decodeURIComponent(req.params.email).trim();
    const result = await getSuppressedEmail(env, emailAddress, idToken);
    res.json(result);
  })
);

// POST /api/email/suppressions → AddSuppressedEmail
router.post(
  '/suppressions',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const { email_address, reason } = req.body as {
      email_address: string;
      reason: SuppressionListReason;
    };
    const result = await addSuppressedEmail(env, email_address, reason, idToken);
    res.json(result);
  })
);

// DELETE /api/email/suppressions/:email → DeleteSuppressedEmail
router.delete(
  '/suppressions/:email',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const emailAddress = decodeURIComponent(req.params.email).trim();
    const result = await deleteSuppressedEmail(env, emailAddress, idToken);
    res.json(result);
  })
);

// ---------------------------------------------------------------------------
// SES Domain
// ---------------------------------------------------------------------------

// GET /api/email/ses-domain?domain=example.com → GetSesDomain
router.get(
  '/ses-domain',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const domain =
      typeof req.query.domain === 'string' ? req.query.domain.trim() : '';
    const result = await getSesDomain(env, domain, idToken);
    res.json(result);
  })
);

// POST /api/email/ses-domain → CreateSesDomain (confirm-step on the frontend)
router.post(
  '/ses-domain',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const { domain, configuration_set_name, tenant_name, mail_from_domain } =
      req.body as {
        domain: string;
        configuration_set_name?: string;
        tenant_name?: string;
        mail_from_domain?: string;
      };
    const result = await createSesDomain(
      env,
      { domain, configuration_set_name, tenant_name, mail_from_domain },
      idToken
    );
    res.json(result);
  })
);

// POST /api/email/ses-domain/refresh → RefreshSesDomain
router.post(
  '/ses-domain/refresh',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const { domain } = req.body as { domain: string };
    const result = await refreshSesDomain(env, domain, idToken);
    res.json(result);
  })
);

// POST /api/email/custom-domain → CreateCustomDomainEntry (confirm-step on the frontend)
router.post(
  '/custom-domain',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const { domain, org_id, tenant_name } = req.body as {
      domain: string;
      org_id: string;
      tenant_name?: string;
    };
    const result = await createCustomDomainEntry(
      env,
      { domain, org_id, tenant_name },
      idToken
    );
    res.json(result);
  })
);

// PUT /api/email/auth-proxy-config → UpdateAuthProxyEmailConfig (confirm-step on the frontend)
router.put(
  '/auth-proxy-config',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const {
      org_id,
      send_from_email_address,
      reply_to_email_address,
      send_from_email_sender_name,
    } = req.body as {
      org_id: string;
      send_from_email_address?: string;
      reply_to_email_address?: string;
      send_from_email_sender_name?: string;
    };
    const result = await updateAuthProxyEmailConfig(
      env,
      {
        org_id,
        send_from_email_address,
        reply_to_email_address,
        send_from_email_sender_name,
      },
      idToken
    );
    res.json(result);
  })
);

// ---------------------------------------------------------------------------
// Email Verification
// ---------------------------------------------------------------------------

// GET /api/email/verification?email=user@example.com → GetEmailVerification
router.get(
  '/verification',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const email =
      typeof req.query.email === 'string' ? req.query.email.trim() : '';
    const result = await getEmailVerification(env, email, idToken);
    res.json(result);
  })
);

// PUT /api/email/verification → UpdateEmailVerification
router.put(
  '/verification',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const { email, valid } = req.body as { email: string; valid: boolean };
    const result = await updateEmailVerification(env, { email, valid }, idToken);
    res.json(result);
  })
);

export default router;
