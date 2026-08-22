# tkhq-ff — Feature Flag Admin GUI

Reads and edits Turnkey feature flags across environments, entirely through `OperatorAgentService`.

```bash
npm install    # root + backend + frontend
npm run dev    # backend :3001, frontend :5173 — then sign in from the UI
```

`backend/` and `frontend/` are separate npm projects; the root `package.json` only delegates (`dev:backend`, `dev:frontend`).

## Layout

```
backend/src/
  auth/       Keycloak sign-in: OIDC flow, sessions, local loopback listener
  config/     Per-environment endpoints and transports
  grpc/       Agent clients (gRPC + Connect), tkinfra token cache, vendored protos
  services/   Flag reads shared by routes
  routes/     REST handlers
frontend/     React 19 + Vite + Tailwind + Radix
Dockerfile    Multi-stage: frontend build → backend serves static
```

## Environments

Chosen by the header dropdown, persisted in `?env=` and localStorage. Every request carries `?env=`; an unknown value 400s rather than falling back, so a typo can't write to the wrong place. **Preprod and prod are flagged in the UI — writes there are live.**

| Environment                | Endpoint                          | Transport               |
| -------------------------- | --------------------------------- | ----------------------- |
| `local`                    | `localhost:4452`                  | gRPC over h2c           |
| `dev` / `preprod` / `prod` | `agent.<env>.turnkey.engineering` | Connect-JSON over HTTPS |

Endpoints mirror `mono/src/go/pkg/environments/environments.go`. `local` needs the agent running (`make launch` in mono).

Both transports exist because neither works everywhere: the local agent speaks gRPC only and 415s on JSON; the remote ingress speaks Connect and answers raw gRPC with a 400. tkinfra carries both for the same reason.

## Authentication

The agent authenticates every call with a Keycloak ID token (`X-ID-Token`) and decides what that identity may do. Click **Sign in with Turnkey SSO**; Keycloak opens in the browser.

**Locally** the callback lands on `http://localhost:36987`, a listener the backend binds at startup. That's tkinfra's loopback URI, borrowed because `kubelogin` is the only Keycloak client that exists today and accepts no other redirect URI — `/api/auth/callback` is rejected with _Invalid parameter: redirect_uri_. Only works because backend and browser share a machine. A recent `tkinfra login` is reused if present, skipping the click; a stale one just shows the sign-in button.

**Deployed** needs its own Keycloak client (redirect URI `https://<host>/api/auth/callback`) from the `staff` realm admins. Setting `OIDC_CLIENT_ID` + `OIDC_REDIRECT_URI` leaves loopback mode and disables the tkinfra fallback, so each visitor acts as themselves. Optional: `OIDC_CLIENT_SECRET` (confidential clients), `CORS_ORIGIN`, `OIDC_IDP_HINT=google` to skip Keycloak's chooser. Whether a Google button appears is a realm setting, not ours. Sessions are in-memory: single replica, and a restart signs everyone out.

## Why the protos are vendored from mono

`backend/src/grpc/proto/` holds 35 `.proto` files copied by `npm run sync-proto`. **They exist solely to build the gRPC client for `local`.**

- `@grpc/proto-loader` builds the client from the service descriptor — no proto, no local client.
- It resolves every transitive `import`, so the whole closure comes across, not one file.
- `dev`/`preprod`/`prod` never touch them; Connect-JSON needs only a URL and hand-written types (`grpc/types.ts`).

**Is this necessary?** Only for `local`. Drop local support and the protos, `sync-proto.js`, and both `@grpc/*` packages go too, leaving plain `fetch`. A hand-trimmed proto is not a safe shortcut: over gRPC the enum _numbers_ are the wire format, and the original placeholder had `FEATURE_FLAG_TVC = 8` against a real value of 24 — writes would have silently hit a different flag. Better ideas welcome.

Re-run `npm run sync-proto` (`MONO_DIR=...` if your checkout isn't at `~/tkhq/code/mono`) when the proto changes upstream.

## REST API

All routes take `?env=`. Mutating RPCs return empty messages upstream, so each mutation re-reads the flag and returns fresh state.

| Method          | Path                                                  |                                                                             |
| --------------- | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| `GET`           | `/api/environments`                                   | Selectable environments                                                     |
| `GET`           | `/api/flags`                                          | Non-deprecated flags. `?with_orgs=true` fills org lists (one call per flag) |
| `GET`           | `/api/flags/:flag`                                    | Detail with org/product rules                                               |
| `PUT`           | `/api/flags/:flag`                                    | `{ enabled, rollout_percent }`                                              |
| `POST`/`DELETE` | `/api/flags/:flag/orgs[/:org_id]`                     | Allow/deny (`{ org_id, enabled }`) or remove an org                         |
| `POST`/`DELETE` | `/api/flags/:flag/products[/:type/:sub_type]`         | Allow/deny or remove a product rule                                         |
| `GET`           | `/api/orgs/:org_id/flags`                             | Flags carrying an override for one org                                      |
| `GET`           | `/api/auth/me`, `/login`, `/callback`, `POST /logout` | Sign-in                                                                     |

`product_type` / `product_sub_type` are proto enum names (`PRODUCT_TYPE_ENTERPRISE`, `PRODUCT_SUB_TYPE_ENTERPRISE_SCALE`), passed through untouched; `PRODUCT_SUB_TYPE_UNSPECIFIED` targets a whole type. Remapping them onto local integers is what made the placeholder write to the wrong product.

`ListFeatureFlags` leaves org lists empty — only `GetFeatureFlag` fills them, hence the `with_orgs` fan-out in `services/flags.ts`. Deprecated flags are dropped there too, by `is_deprecated` with a static backstop.

## Environment variables

| Variable                             | Default                 |                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------- |
| `PORT`                               | `3001`                  | Backend HTTP port                                           |
| `DEFAULT_ENVIRONMENT`                | `local`                 | Used when a request omits `?env=`                           |
| `OPERATOR_AGENT_GRPC_HOST` / `_PORT` | `localhost` / `4452`    | Override the `local` target only                            |
| `APP_URL`                            | `http://localhost:5173` | Sign-in return target when the referring page can't be read |

Plus the deployment-only `OIDC_*` / `CORS_ORIGIN` above. See `backend/.env.example`.

## Docker

```bash
docker compose up --build   # http://localhost:3001
```

Only remote environments are reachable from the container, and it needs a Keycloak client — loopback sign-in can't work there.

## Known gaps

- [ ] No roles of its own: the agent authorizes each call, but anyone who can sign in can pick prod and write to it.
- [ ] Deployed sign-in is implemented but unexercised — needs a registered Keycloak client.
- [ ] Sessions in-memory — single replica.
- [ ] No CI/deploy workflow (`.github/` doesn't exist).
