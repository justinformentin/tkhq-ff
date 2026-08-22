import { Router } from 'express';
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
} from '../services/emailOps';
import { callContext, handler } from './handler';

const router = Router();

// ---------------------------------------------------------------------------
// SES Domains
// ---------------------------------------------------------------------------

// GET /api/email/ses/domains/:domain → GetSesDomain
router.get(
  '/ses/domains/:domain',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const result = await getSesDomain(env, req.params.domain, idToken);
    res.json(result);
  })
);

// POST /api/email/ses/domains → CreateSesDomain
router.post(
  '/ses/domains',
  handler(async (req, res) => {
    const { domain, mail_from_domain } = req.body as {
      domain: string;
      mail_from_domain?: string;
    };
    const { env, idToken } = await callContext(req);
    const result = await createSesDomain(env, domain, mail_from_domain, idToken);
    res.json(result);
  })
);

// POST /api/email/ses/domains/:domain/refresh → RefreshSesDomain
router.post(
  '/ses/domains/:domain/refresh',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const result = await refreshSesDomain(env, req.params.domain, idToken);
    res.json(result);
  })
);

// ---------------------------------------------------------------------------
// Custom Domains
// ---------------------------------------------------------------------------

// POST /api/email/custom-domains → CreateCustomDomainEntry
router.post(
  '/custom-domains',
  handler(async (req, res) => {
    const { domain, org_id } = req.body as {
      domain: string;
      org_id?: string;
    };
    const { env, idToken } = await callContext(req);
    const result = await createCustomDomainEntry(env, domain, org_id, idToken);
    res.json(result);
  })
);

// ---------------------------------------------------------------------------
// Auth Proxy Email Config
// ---------------------------------------------------------------------------

// PUT /api/email/auth-proxy/config → UpdateAuthProxyEmailConfig
router.put(
  '/auth-proxy/config',
  handler(async (req, res) => {
    const { from_email, from_name, reply_to_email } = req.body as {
      from_email?: string;
      from_name?: string;
      reply_to_email?: string;
    };
    const { env, idToken } = await callContext(req);
    const result = await updateAuthProxyEmailConfig(
      env,
      { from_email, from_name, reply_to_email },
      idToken
    );
    res.json(result);
  })
);

// ---------------------------------------------------------------------------
// Suppressed Emails (paginated)
// ---------------------------------------------------------------------------

// GET /api/email/suppressed?page_token=&page_size= → ListSuppressedEmails
router.get(
  '/suppressed',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const pageToken = req.query.page_token as string | undefined;
    const pageSizeRaw = req.query.page_size;
    const pageSize =
      pageSizeRaw !== undefined ? parseInt(pageSizeRaw as string, 10) : undefined;

    const result = await listSuppressedEmails(env, pageToken, pageSize, idToken);
    res.json(result);
  })
);

// GET /api/email/suppressed/:emailAddress → GetSuppressedEmail
// Must come AFTER the bare /suppressed route to avoid shadowing.
router.get(
  '/suppressed/:emailAddress',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const result = await getSuppressedEmail(
      env,
      decodeURIComponent(req.params.emailAddress),
      idToken
    );
    res.json(result);
  })
);

// POST /api/email/suppressed → AddSuppressedEmail
router.post(
  '/suppressed',
  handler(async (req, res) => {
    const { email_address } = req.body as { email_address: string };
    const { env, idToken } = await callContext(req);
    const result = await addSuppressedEmail(env, email_address, idToken);
    res.json(result);
  })
);

// DELETE /api/email/suppressed/:emailAddress → DeleteSuppressedEmail
router.delete(
  '/suppressed/:emailAddress',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    await deleteSuppressedEmail(
      env,
      decodeURIComponent(req.params.emailAddress),
      idToken
    );
    res.json({});
  })
);

// ---------------------------------------------------------------------------
// Email Verification
// ---------------------------------------------------------------------------

// GET /api/email/verification/:emailAddress → GetEmailVerification
router.get(
  '/verification/:emailAddress',
  handler(async (req, res) => {
    const { env, idToken } = await callContext(req);
    const result = await getEmailVerification(
      env,
      decodeURIComponent(req.params.emailAddress),
      idToken
    );
    res.json(result);
  })
);

// PUT /api/email/verification/:emailAddress → UpdateEmailVerification
router.put(
  '/verification/:emailAddress',
  handler(async (req, res) => {
    const { status } = req.body as { status?: string };
    const { env, idToken } = await callContext(req);
    const result = await updateEmailVerification(
      env,
      decodeURIComponent(req.params.emailAddress),
      status,
      idToken
    );
    res.json(result);
  })
);

export default router;
