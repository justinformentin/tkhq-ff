/**
 * Resolves the identity the operator agent should be called as.
 *
 * Preference order:
 *   1. A session from signing in through Keycloak. Works locally and deployed,
 *      and is the only option on a server.
 *   2. Locally, the token `tkinfra login` already cached on this machine — so
 *      if you've used the CLI recently the app just works with no extra click.
 *      Never used when a real Keycloak client is configured: on a server that
 *      cache is either absent or one person's credentials shared with every
 *      visitor.
 *
 * With neither, the request 401s and the UI offers a sign-in button.
 */
import { NextFunction, Request, Response } from 'express';
import { getIdToken as getCachedIdToken } from '../grpc/auth';
import { getOidcConfig } from './oidc';
import { SESSION_COOKIE, getSession, sessionIdToken } from './session';

export class NotLoggedInError extends Error {
  readonly loginUrl = '/api/auth/login';

  constructor(message = 'Not signed in.') {
    super(message);
    this.name = 'NotLoggedInError';
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Resolves the ID token to call the operator agent with. */
      getIdToken?: () => Promise<string>;
    }
  }
}

/** The ID token for this request, as resolved by requireIdentity. */
export function idTokenOf(req: Request): Promise<string> {
  if (!req.getIdToken) throw new NotLoggedInError();
  return req.getIdToken();
}

export function requireIdentity(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const config = getOidcConfig();
  const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
  const session = getSession(sessionId);

  if (session && sessionId) {
    req.getIdToken = () => sessionIdToken(config, sessionId, session);
    next();
    return;
  }

  if (config.loopback) {
    // Falling back to the CLI's cache. A stale one is not an error worth
    // showing — it just means "not signed in", which the UI can act on.
    req.getIdToken = () =>
      getCachedIdToken().catch(() => {
        throw new NotLoggedInError();
      });
    next();
    return;
  }

  next(new NotLoggedInError());
}
