/**
 * Connect-protocol client for the remote operator agents.
 *
 * Requests are POSTed to /<package>.<Service>/<Method> with protojson bodies,
 * matching tkinfra's HTTP transport
 * (mono: src/go/tkinfra/internal/agent/client/transport.go).
 */
const SERVICE_PATH = '/services.operator_agent.v1.OperatorAgentService';
const REQUEST_TIMEOUT_MS = 30_000;

export class AgentHttpError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'AgentHttpError';
  }
}

/**
 * protojson emits lowerCamelCase field names, while the gRPC client is loaded
 * with keepCase and emits the proto's snake_case. Normalize to snake_case so
 * both transports hand back the same shape.
 */
function toSnakeCase(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toSnakeCase);

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`),
        toSnakeCase(val),
      ])
    );
  }

  return value;
}

export async function httpCall<TReq, TRes>(
  baseUrl: string,
  method: string,
  request: TReq,
  idToken: string
): Promise<TRes> {
  const response = await fetch(`${baseUrl}${SERVICE_PATH}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // protojson accepts either the proto field names or their lowerCamelCase
      // forms, so requests go out as-is.
      'X-ID-Token': idToken,
    },
    body: JSON.stringify(request ?? {}),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const text = await response.text();

  if (!response.ok) {
    let message = text;
    try {
      message = (JSON.parse(text) as { message?: string }).message || text;
    } catch {
      // Not JSON — the raw body is the best detail available.
    }
    throw new AgentHttpError(
      message || `Operator agent returned ${response.status}`,
      response.status
    );
  }

  return toSnakeCase(text ? JSON.parse(text) : {}) as TRes;
}
