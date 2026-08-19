import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

// The proto file is co-located with this client at runtime.
// In production (dist/grpc/), it is copied by the Dockerfile.
const PROTO_PATH = path.join(__dirname, 'operator_agent.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const OperatorAgentService =
  protoDescriptor.operator_agent.v1.OperatorAgentService;

let clientInstance: grpc.Client | null = null;

function getGrpcAddress(): string {
  const host = process.env.OPERATOR_AGENT_GRPC_HOST || 'localhost';
  const port = process.env.OPERATOR_AGENT_GRPC_PORT || '9090';
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
export function grpcCall<TReq, TRes>(
  method: string,
  request: TReq
): Promise<TRes> {
  return new Promise((resolve, reject) => {
    const client = getGrpcClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)[method](
      request,
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
