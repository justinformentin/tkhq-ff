/**
 * Shared plumbing for the API routes.
 *
 * Express 4 doesn't notice a promise an async handler rejects with, so every
 * route would otherwise end in the same try/catch that forwards to next().
 * `handler` does that once, leaving each route as just its own logic.
 */
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { idTokenOf } from '../auth/identity';
import { Environment } from '../config/environments';
import { envOf } from './env';

/** Wraps an async route so a thrown or rejected error reaches errorHandler. */
export function handler(
  route: (req: Request, res: Response) => Promise<void>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    route(req, res).catch(next);
  };
}

/** Which operator agent to call, and whose identity to call it with. */
export interface CallContext {
  env: Environment;
  idToken: string;
}

/**
 * Resolved once per request and passed around, so a handler that both writes
 * and re-reads doesn't look up the environment or mint a token twice.
 */
export async function callContext(req: Request): Promise<CallContext> {
  return { env: envOf(req), idToken: await idTokenOf(req) };
}
