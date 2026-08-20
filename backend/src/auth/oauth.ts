/**
 * Bits of the OAuth token endpoint shared by the two callers of it: the
 * browser sign-in flow (./oidc.ts) and the refresh of tkinfra's cached token
 * (../grpc/auth.ts).
 */

/** Keycloak reports a rejected token request with these two fields. */
export interface OAuthErrorBody {
  error?: string;
  error_description?: string;
}

/**
 * Reads a token-endpoint body. A rejection from a proxy in front of Keycloak
 * isn't JSON at all; treating that as an empty body leaves the status as the
 * only detail, which is exactly what `tokenErrorDetail` falls back to.
 */
export async function readTokenBody<T extends OAuthErrorBody>(
  response: Response
): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

/** The parenthesized detail for a failed token request, e.g. "401 invalid_grant". */
export function tokenErrorDetail(
  status: number,
  body: OAuthErrorBody
): string {
  return [status, body.error, body.error_description].filter(Boolean).join(' ');
}
