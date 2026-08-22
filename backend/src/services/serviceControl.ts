/**
 * Service Control — wraps OperatorAgentService RPCs that operate on
 * Kubernetes deployments (scale replicas, redirect traffic).
 *
 * These are DESTRUCTIVE, engineering-only operations that require
 * `service:admin` RBAC. They affect live Kubernetes infrastructure.
 *
 * Pattern mirrors orgOps.ts exactly: agentCall + X-ID-Token auth,
 * no enum remapping, no silent env fallbacks.
 */

import { agentCall } from '../grpc/client';
import { Environment } from '../config/environments';
import {
  ScaleServiceRequest,
  ScaleServiceResponse,
  DirectServiceRequest,
  DirectServiceResponse,
} from '../grpc/types';

// ---------------------------------------------------------------------------
// ScaleService — adjust replica count for a Kubernetes deployment
// ---------------------------------------------------------------------------

/**
 * Scales a named service's Kubernetes deployment to the specified replica
 * count in the given environment.
 *
 * Uses kubernetes.ClientFromIDToken internally on the backend (tkinfra
 * scale.go) — the caller's ID token must have service:admin RBAC.
 *
 * @param env         Which operator agent to target
 * @param service     Kubernetes deployment/service name (e.g. "api-server")
 * @param replicas    Target replica count (must be >= 0)
 * @param environment Proto enum name for the environment
 *                    (e.g. "ENVIRONMENT_PRODUCTION")
 * @param idToken     Caller's OIDC ID token (forwarded as X-ID-Token)
 */
export async function scaleService(
  env: Environment,
  service: string,
  replicas: number,
  environment: string,
  idToken: string
): Promise<ScaleServiceResponse> {
  return agentCall<ScaleServiceRequest, ScaleServiceResponse>(
    env,
    'ScaleService',
    { service, replicas, environment },
    idToken
  );
}

// ---------------------------------------------------------------------------
// DirectService — redirect/direct traffic for a Kubernetes service
// ---------------------------------------------------------------------------

/**
 * Directs (redirects) traffic for a named service in the given environment.
 *
 * Uses kubernetes.ClientFromIDToken internally on the backend (tkinfra
 * direct.go) — the caller's ID token must have service:admin RBAC.
 *
 * @param env         Which operator agent to target
 * @param service     Kubernetes deployment/service name (e.g. "api-server")
 * @param direction   Traffic direction target (e.g. "canary", "stable")
 * @param environment Proto enum name for the environment
 * @param idToken     Caller's OIDC ID token (forwarded as X-ID-Token)
 */
export async function directService(
  env: Environment,
  service: string,
  direction: string,
  environment: string,
  idToken: string
): Promise<DirectServiceResponse> {
  return agentCall<DirectServiceRequest, DirectServiceResponse>(
    env,
    'DirectService',
    { service, direction, environment },
    idToken
  );
}
