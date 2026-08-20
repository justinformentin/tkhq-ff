/**
 * Callback listener for local development.
 *
 * The only Keycloak client that exists today is tkinfra's (`kubelogin`), and
 * it accepts exactly one redirect URI: http://localhost:36987. Pointing it at
 * this app's own callback route is rejected with "Invalid parameter:
 * redirect_uri". So locally we do what tkinfra does — bind that port and catch
 * the redirect ourselves. It works only because the backend and the browser
 * are on the same machine; a deployment registers a real client and uses
 * /api/auth/callback instead.
 *
 * Cookies ignore the port, so the session cookie set from :36987 is sent to
 * the app on :5173 or :3001.
 */
import http from 'http';
import { LOOPBACK_ADDRESS, OidcConfig, exchangeCode } from './oidc';
import { SESSION_COOKIE, consumePendingLogin, createSession } from './session';

const PORT = Number(LOOPBACK_ADDRESS.split(':')[1]);

// Bound on both stacks: browsers resolve "localhost" to either 127.0.0.1 or
// ::1, and listening on just one makes sign-in fail depending on the machine.
// Binding the loopback addresses explicitly keeps it off the network.
const HOSTS = ['127.0.0.1', '::1'];

function reply(
  res: http.ServerResponse,
  status: number,
  message: string,
  headers: Record<string, string> = {}
): void {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
  res.end(
    `<!doctype html><meta charset="utf-8"><title>Sign in</title>` +
      `<body style="font-family:system-ui;background:#0b0f19;color:#e5e7eb;` +
      `display:grid;place-items:center;height:100vh;margin:0">` +
      `<p>${message}</p></body>`
  );
}

export function startLoopbackListener(config: OidcConfig): http.Server[] {
  const handler: http.RequestListener = async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);

    const error = url.searchParams.get('error');
    if (error) {
      reply(
        res,
        400,
        `Sign-in failed: ${
          url.searchParams.get('error_description') || error
        }. You can close this tab.`
      );
      return;
    }

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      reply(res, 400, 'Nothing to do here. You can close this tab.');
      return;
    }

    // One shot — a replayed callback must not reuse the PKCE verifier.
    const pending = consumePendingLogin(state);
    if (!pending) {
      reply(res, 400, 'This sign-in link expired. Start again from the app.');
      return;
    }

    try {
      const sessionId = createSession(
        await exchangeCode(config, code, pending.codeVerifier)
      );

      reply(res, 302, 'Signed in. Returning to the app…', {
        // Host-only cookie: ports are not part of cookie scope, so the app on
        // :5173 / :3001 sees this one.
        'Set-Cookie': `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax`,
        Location: pending.returnTo,
      });
    } catch (err) {
      reply(
        res,
        500,
        `Sign-in failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  return HOSTS.map((host) => {
    const server = http.createServer(handler);

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `Port ${PORT} is in use on ${host}, so browser sign-in may not work. ` +
            `A tkinfra login is probably mid-flight — retry in a moment.`
        );
        return;
      }
      // A host without IPv6 (or without IPv4) is fine as long as the other binds.
      if (err.code !== 'EADDRNOTAVAIL' && err.code !== 'EAFNOSUPPORT') {
        console.error(`Loopback listener error on ${host}:`, err.message);
      }
    });

    server.listen(PORT, host);
    return server;
  });
}
