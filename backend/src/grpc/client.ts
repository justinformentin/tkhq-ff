import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { getIdToken } from './auth';
import { httpCall } from './http';
import { Environment, getEnvironmentConfig } from '../config/environments';

// mono: src/go/tkinfra/internal/keycloak/header.go
const ID_TOKEN_HEADER = 'X-ID-Token';

const CALL_TIMEOUT_MS = 30_000;

// Protos are vendored from mono by `npm run sync-proto`, keeping mono's import
// paths intact so PROTO_DIR resolves the whole import closure.
// In production (dist/grpc/proto/), the tree is copied by the Dockerfile.
const PROTO_DIR = path.join(__dirname, 'proto');
const PROTO_PATH = path.join(
  PROTO_DIR,
  'services/operator_agent/v1/operator_agent.proto'
);

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [PROTO_DIR],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const OperatorAgentService =
  protoDescriptor.services.operator_agent.v1.OperatorAgentService;

const clients = new Map<string, grpc.Client>();

function getGrpcClient(target: string): grpc.Client {
  let client = clients.get(target);

  if (!client) {
    // Only local/test use this transport, and they serve plaintext h2c.
    client = new OperatorAgentService(
      target,
      grpc.credentials.createInsecure()
    ) as grpc.Client;
    clients.set(target, client);
  }

  return client;
}

async function grpcCall<TReq, TRes>(
  target: string,
  method: string,
  request: TReq
): Promise<TRes> {
  // The operator agent authenticates every call by ID token.
  const metadata = new grpc.Metadata();
  metadata.set(ID_TOKEN_HEADER, await getIdToken());

  return new Promise((resolve, reject) => {
    const client = getGrpcClient(target);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)[method](
      request,
      metadata,
      { deadline: Date.now() + CALL_TIMEOUT_MS },
      (err: grpc.ServiceError | null, response: TRes) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      }
    );
  });
}

/**
 * Calls one OperatorAgentService method against the given environment, over
 * whichever transport that environment accepts. Both transports return the
 * proto's snake_case field names.
 */
export function agentCall<TReq, TRes>(
  env: Environment,
  method: string,
  request: TReq
): Promise<TRes> {
  const { transport, target } = getEnvironmentConfig(env);

  return transport === 'grpc'
    ? grpcCall<TReq, TRes>(target, method, request)
    : httpCall<TReq, TRes>(target, method, request);
}
