/**
 * Operator agent endpoints, mirroring
 * mono: src/go/pkg/environments/environments.go (operatorAgentEndpoints).
 *
 * Transports differ by environment, and neither one works for both:
 *  - local/test run the agent directly, serving gRPC over h2c. Plain HTTP/1.1
 *    gets no response at all and JSON bodies are rejected with a 415.
 *  - dev/preprod/prod sit behind an ingress that speaks the Connect protocol
 *    (POST /<package>.<Service>/<Method> with protojson bodies) and answers
 *    raw gRPC with a bare HTTP 400.
 *
 * tkinfra carries both for the same reason; OPERATOR_AGENT_PROTOCOL=grpc is
 * what makes it fail against dev.
 */

export const ENVIRONMENTS = ['local', 'dev', 'preprod', 'prod'] as const;

export type Environment = (typeof ENVIRONMENTS)[number];

export interface EnvironmentConfig {
  /** 'grpc' talks h2c to a local agent; 'http' uses Connect-JSON over TLS. */
  transport: 'grpc' | 'http';
  /** host:port for gRPC, or the base URL for HTTP. */
  target: string;
  /** Whether writes against this environment should be treated as dangerous. */
  production: boolean;
}

const DEFAULT_ENVIRONMENTS: Record<Environment, EnvironmentConfig> = {
  local: {
    transport: 'grpc',
    target: 'localhost:4452',
    production: false,
  },
  dev: {
    transport: 'http',
    target: 'https://agent.dev.turnkey.engineering',
    production: false,
  },
  preprod: {
    transport: 'http',
    target: 'https://agent.preprod.turnkey.engineering',
    production: true,
  },
  prod: {
    transport: 'http',
    target: 'https://agent.prod.turnkey.engineering',
    production: true,
  },
};

export const DEFAULT_ENVIRONMENT: Environment =
  (process.env.DEFAULT_ENVIRONMENT as Environment) || 'local';

export class InvalidEnvironmentError extends Error {
  constructor(value: string) {
    super(
      `Unknown environment "${value}". Expected one of: ${ENVIRONMENTS.join(', ')}.`
    );
    this.name = 'InvalidEnvironmentError';
  }
}

export function isEnvironment(value: unknown): value is Environment {
  return ENVIRONMENTS.includes(value as Environment);
}

export function getEnvironmentConfig(env: Environment): EnvironmentConfig {
  const config = DEFAULT_ENVIRONMENTS[env];

  // Local is the one people relocate — a different port, or an agent reachable
  // through a tunnel.
  if (env === 'local') {
    const host = process.env.OPERATOR_AGENT_GRPC_HOST;
    const port = process.env.OPERATOR_AGENT_GRPC_PORT;
    if (host || port) {
      return {
        ...config,
        target: `${host || 'localhost'}:${port || '4452'}`,
      };
    }
  }

  return config;
}

export function listEnvironments() {
  return ENVIRONMENTS.map((name) => ({
    name,
    ...getEnvironmentConfig(name),
  }));
}
