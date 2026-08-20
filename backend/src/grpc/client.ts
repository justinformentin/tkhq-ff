import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { getIdToken } from './auth';

// mono: src/go/tkinfra/internal/keycloak/header.go
const ID_TOKEN_HEADER = 'X-ID-Token';

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

let clientInstance: grpc.Client | null = null;

function getGrpcAddress(): string {
  const host = process.env.OPERATOR_AGENT_GRPC_HOST || 'localhost';
  const port = process.env.OPERATOR_AGENT_GRPC_PORT || '4452';
  return `${host}:${port}`;
}

export function getGrpcClient(): grpc.Client {
  if (!clientInstance) {
    const address = getGrpcAddress();
    // TODO: For production with mTLS, replace createInsecure() with:
    //   grpc.credentials.createSsl(rootCerts, privateKey, certChain)
    // and set GRPC_SSL_TARGET_NAME_OVERRIDE if needed.
    clientInstance = new OperatorAgentService(
      address,
      grpc.credentials.createInsecure()
    ) as grpc.Client;
  }
  return clientInstance as grpc.Client;
}

/**
 * Promisified gRPC unary call helper.
 * Usage: grpcCall<ReqType, ResType>('MethodName', requestObject)
 */
export async function grpcCall<TReq, TRes>(
  method: string,
  request: TReq
): Promise<TRes> {
  // The operator agent authenticates every call by ID token.
  const metadata = new grpc.Metadata();
  metadata.set(ID_TOKEN_HEADER, await getIdToken());

  return new Promise((resolve, reject) => {
    const client = getGrpcClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)[method](
      request,
      metadata,
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
