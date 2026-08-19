import { Request, Response, NextFunction } from 'express';
import * as grpc from '@grpc/grpc-js';

export function errorHandler(
  err: Error | grpc.ServiceError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

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
