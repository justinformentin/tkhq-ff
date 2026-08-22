/**
 * Service Control operations — wrappers around ScaleService and DirectService
 * RPCs exposed by OperatorAgentService.
 *
 * Both RPCs are called via the standard agentCall transport (gRPC for local,
 * Connect-JSON for dev/preprod/prod). They mutate live infrastructure and
 * return empty responses on success.
 *
 * NOTE: ScaleService and DirectService are engineering-only operations that
 * directly affect Kubernetes deployments. The method names here map to the
 * proto RPC names, which the Connect transport POSTs to:
 *   /services.operator_agent.v1.OperatorAgentService/ScaleService
 *   /services.operator_agent.v1.OperatorAgentService/DirectService
 */

import { agentCall } from '../grpc/client';
import { Environment } from '../config/environments';
import {
  ScaleServiceRequest,
  ScaleServiceResponse,
  DirectServiceRequest,
  DirectServiceResponse,
} from '../grpc/types';

/**
 * Scales a named service to the given replica count in the specified
 * environment. Maps to the ScaleService RPC.
 */
export async function scaleService(
  env: Environment,
  service_name: string,
  replicas: number,
  environment: string,
  idToken: string
): Promise<ScaleServiceResponse> {
  return agentCall<ScaleServiceRequest, ScaleServiceResponse>(
    env,
    'ScaleService',
    { service_name, replicas, environment },
    idToken
  );
}

/**
 * Directs a percentage of traffic to a named service in the specified
 * environment. Maps to the DirectService RPC.
 *
 * traffic_weight is an integer in [0, 100] representing the percentage of
 * traffic to send to the service.
 */
export async function directService(
  env: Environment,
  service_name: string,
  traffic_weight: number,
  environment: string,
  idToken: string
): Promise<DirectServiceResponse> {
  return agentCall<DirectServiceRequest, DirectServiceResponse>(
    env,
    'DirectService',
    { service_name, traffic_weight, environment },
    idToken
  );
}
