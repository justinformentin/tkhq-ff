import { Request, Response, NextFunction } from 'express';
import * as grpc from '@grpc/grpc-js';
import { AuthError } from '../grpc/auth';
import { AgentHttpError } from '../grpc/http';
import { InvalidEnvironmentError } from '../config/environments';

export function errorHandler(
  err: Error | grpc.ServiceError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  // Couldn't get a Keycloak token at all — the caller needs to log in, which
  // is actionable in a way a generic 500 isn't.
  if (err instanceof AuthError) {
    res.status(401).json({ error: err.message });
    return;
  }

  if (err instanceof InvalidEnvironmentError) {
    res.status(400).json({ error: err.message });
    return;
  }

  // The Connect transport reports failures as HTTP statuses; pass them through.
  if (err instanceof AgentHttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // Handle gRPC errors
  if ('code' in err && typeof err.code === 'number') {
    const grpcError = err as grpc.ServiceError;
    const statusMap: Record<number, number> = {
      [grpc.status.NOT_FOUND]: 404,
      [grpc.status.INVALID_ARGUMENT]: 400,
      [grpc.status.PERMISSION_DENIED]: 403,
      [grpc.status.UNAUTHENTICATED]: 401,
      [grpc.status.ALREADY_EXISTS]: 409,
      [grpc.status.UNIMPLEMENTED]: 501,
    };
    const httpStatus = statusMap[grpcError.code] || 500;
    res.status(httpStatus).json({
      error: grpcError.message || 'gRPC error',
      code: grpcError.code,
    });
    return;
  }

  res.status(500).json({
    error: err.message || 'Internal server error',
  });
}
