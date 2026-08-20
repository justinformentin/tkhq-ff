import { Request, Router } from 'express';
import {
  authorizationUrl,
  claimsOf,
  exchangeCode,
  getOidcConfig,
  logoutUrl,
  startLogin,
} from '../auth/oidc';
import {
  SESSION_COOKIE,
  consumePendingLogin,
  createSession,
  destroySession,
  getSession,
  rememberPendingLogin,
} from '../auth/session';
import { getIdToken as getCachedIdToken } from '../grpc/auth';
import { handler } from './handler';

const router = Router();

const NOT_SIGNED_IN = {
  error: 'Not signed in.',
  loginUrl: '/api/auth/login',
};

/** Only ever redirect within this app — an open redirect here is a phishing hop. */
function safePath(value: unknown): string {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//')
    ? value
    : '/';
}

/**
 * Where to send the browser after sign-in. The loopback listener runs on its
 * own port, so it needs an absolute URL to get back to the app; we take it
 * from the page the user clicked from.
 */
function appOrigin(
  req: Request,
  redirectUri: string,
  loopback: boolean
): string {
  if (!loopback) return new URL(redirectUri).origin;

  const referer = req.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return url.origin;
      }
    } catch {
      // Unparseable Referer — fall through to the configured default.
    }
  }

  return process.env.APP_URL || 'http://localhost:5173';
}

function cookieOptions(redirectUri: string) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: redirectUri.startsWith('https://'),
    path: '/',
  };
}

// GET /api/auth/me — who the backend will act as, or 401 with a way to fix it.
router.get(
  '/me',
  handler(async (req, res) => {
    const config = getOidcConfig();
    const session = getSession(req.cookies?.[SESSION_COOKIE]);

    if (session) {
      res.json({ source: 'session', user: session.user });
      return;
    }

    if (config.loopback) {
      try {
        // No session, but a warm tkinfra cache is just as good locally.
        const idToken = await getCachedIdToken();
        res.json({ source: 'tkinfra', user: claimsOf(idToken) });
        return;
      } catch {
        // Stale or absent — fall through to the sign-in prompt.
      }
    }

    res.status(401).json(NOT_SIGNED_IN);
  })
);

// GET /api/auth/login — hand off to Keycloak.
router.get(
  '/login',
  handler(async (req, res) => {
    const config = getOidcConfig();
    const origin = appOrigin(req, config.redirectUri, config.loopback);
    const returnTo = new URL(safePath(req.query.returnTo), origin).toString();

    const pending = startLogin(returnTo);
    rememberPendingLogin(pending.state, pending.codeVerifier, pending.returnTo);

    res.redirect(await authorizationUrl(config, pending));
  })
);

// GET /api/auth/callback — used when a deployment has its own Keycloak client.
// The local loopback flow is answered by auth/loopback.ts instead.
router.get(
  '/callback',
  handler(async (req, res) => {
    const config = getOidcConfig();

    if (req.query.error) {
      res.status(400).json({
        error: String(req.query.error_description || req.query.error),
      });
      return;
    }

    const { code, state } = req.query;

    if (typeof code !== 'string' || typeof state !== 'string') {
      res.status(400).json({ error: 'Missing code or state.' });
      return;
    }

    // An unknown state means a replayed, forged, or long-abandoned callback.
    const login = consumePendingLogin(state);
    if (!login) {
      res.status(400).json({ error: 'Login expired — please try again.' });
      return;
    }

    const tokens = await exchangeCode(config, code, login.codeVerifier);
    const sessionId = createSession(tokens);

    res.cookie(SESSION_COOKIE, sessionId, cookieOptions(config.redirectUri));
    res.redirect(login.returnTo);
  })
);

// POST /api/auth/logout — drop the session, and end it at Keycloak too.
router.post(
  '/logout',
  handler(async (req, res) => {
    const config = getOidcConfig();
    const session = destroySession(req.cookies?.[SESSION_COOKIE]);

    res.clearCookie(SESSION_COOKIE, cookieOptions(config.redirectUri));

    if (!session) {
      res.json({ logoutUrl: null });
      return;
    }

    // Ending the Keycloak session too, so signing out doesn't silently sign
    // straight back in on the next click.
    const origin = appOrigin(req, config.redirectUri, config.loopback);
    res.json({
      logoutUrl: await logoutUrl(config, session.tokens.idToken, origin),
    });
  })
);

export default router;
