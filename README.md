# tkhq-ff — Feature Flag Admin GUI

Internal admin tool for reading and editing Turnkey feature flags across environments. All reads and writes go through `OperatorAgentService` — no direct database access.

## Quick start

```bash
npm install     # installs root, backend, and frontend
npm run dev     # backend :3001 + frontend :5173
tkinfra login   # if the UI returns 401
```

`backend/` and `frontend/` are independent npm projects with their own lockfiles; the root `package.json` only delegates. Use `npm run dev:backend` / `npm run dev:frontend` to run one at a time.

## Layout

```
tkhq-ff/
├── backend/          Express REST → operator agent bridge (Node 20 + TypeScript)
│   ├── src/config/   Per-environment endpoints and transports
│   ├── src/grpc/     Agent clients (gRPC + Connect), auth, vendored protos
│   └── src/routes/   REST handlers
├── frontend/         React 19 + Vite + Tailwind + Radix (dark theme)
├── Dockerfile        Multi-stage: frontend build → backend serves static
└── docker-compose.yml
```

## Environments

Pick the target with the header dropdown. The choice persists in `?env=` and localStorage, so a copied URL opens the same environment. Every request carries `?env=`; an unrecognized value is rejected with a 400 rather than falling back, so a typo can't send a write somewhere unintended.

| Environment | Endpoint | Transport |
|---|---|---|
| `local` | `localhost:4452` | gRPC over h2c |
| `dev` | `agent.dev.turnkey.engineering` | Connect-JSON over HTTPS |
| `preprod` | `agent.preprod.turnkey.engineering` | Connect-JSON over HTTPS |
| `prod` | `agent.prod.turnkey.engineering` | Connect-JSON over HTTPS |

Endpoints mirror `mono/src/go/pkg/environments/environments.go`. **Preprod and prod are marked in the UI — writes there are live.** `local` requires the operator agent running (`make launch` in mono).

Neither transport works for both: the local agent serves gRPC only and rejects JSON with a 415, while the remote agents sit behind an ingress that speaks Connect and answers raw gRPC with an HTTP 400. tkinfra carries both for the same reason.

## Authentication

The operator agent authenticates every call with a Keycloak ID token in an `X-ID-Token` header. `backend/src/grpc/auth.ts` refreshes one from the token cache `tkinfra login` already writes (`~/Library/Caches/tkhq-keycloak/kubelogin`), so the GUI and the CLI share a single login. Rotated refresh tokens are written back — dropping them would silently log your CLI out. A missing or expired cache surfaces as a 401 telling you to run `tkinfra login`.

## Why the protos are vendored from mono

`backend/src/grpc/proto/` holds 35 `.proto` files copied from mono by `npm run sync-proto`. **They exist solely to build the gRPC client for `local`.**

- `@grpc/proto-loader` constructs a gRPC client from the service descriptor, so there is no local client without a proto.
- It resolves every transitive `import`, which is why the whole closure comes across and not one file — `operator_agent.proto` pulls in `product.proto` and `dashboard_api.proto`, which cascade.
- `dev`/`preprod`/`prod` never touch them. Connect-JSON needs only a URL and hand-written types (`src/grpc/types.ts`).

**Is this necessary?** Only for `local`. Drop local support and the proto tree, `sync-proto.js`, and both `@grpc/*` packages go with it, leaving a backend that is plain `fetch`. Hand-maintaining a trimmed proto is not a safe shortcut: over gRPC the enum *numbers* are the wire format, and the original hand-written placeholder had `FEATURE_FLAG_TVC = 8` where the real value is 24 — writes would have silently landed on a different flag. Better ideas welcome.

Re-run `npm run sync-proto` (or `MONO_DIR=... npm run sync-proto`) after the proto changes upstream.

## REST API

Every route takes `?env=local|dev|preprod|prod`. Mutating RPCs return empty messages upstream, so each mutation re-reads the flag and returns its fresh state.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/environments` | List selectable environments |
| `GET` | `/api/flags` | List non-deprecated flags |
| `GET` | `/api/flags/:flag` | Flag detail with org/product rules |
| `PUT` | `/api/flags/:flag` | Set `enabled` + `rollout_percent` |
| `POST` | `/api/flags/:flag/orgs` | Allow/deny an org (`{ org_id, enabled }`) |
| `DELETE` | `/api/flags/:flag/orgs/:org_id` | Remove an org rule |
| `POST` | `/api/flags/:flag/products` | Allow/deny a product (`{ product_type, product_sub_type, enabled }`) |
| `DELETE` | `/api/flags/:flag/products/:type/:sub_type` | Remove a product rule |

`product_type` and `product_sub_type` are proto enum names (`PRODUCT_TYPE_ENTERPRISE`, `PRODUCT_SUB_TYPE_ENTERPRISE_SCALE`), passed through untouched. `PRODUCT_SUB_TYPE_UNSPECIFIED` targets a whole product type. Mapping them onto local integers is what made the placeholder write to the wrong product.

Flags are hidden when the agent reports `is_deprecated`; `backend/src/routes/flags.ts` keeps a static list as a backstop for deployments that don't populate it.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Backend HTTP port |
| `DEFAULT_ENVIRONMENT` | `local` | Environment used when a request omits `?env=` |
| `OPERATOR_AGENT_GRPC_HOST` | `localhost` | Overrides the `local` host only |
| `OPERATOR_AGENT_GRPC_PORT` | `4452` | Overrides the `local` port only |
| `KEYCLOAK_ISSUER` | staff realm | OIDC issuer |
| `KEYCLOAK_CLIENT_ID` | `kubelogin` | OIDC client |
| `KEYCLOAK_ACCOUNT` | = client id | Token cache name, for `tkinfra --acct` |
| `MONO_DIR` | `~/tkhq/code/mono` | Checkout used by `npm run sync-proto` |
| `VITE_API_URL` | `/api` | Frontend API base, for non-proxy deployments |

## Docker

```bash
docker compose up --build   # http://localhost:3001
```

Only the remote environments are reachable from inside the container; `local` would need the agent exposed to it.

## Known gaps

- [ ] No authorization layer — anyone who can reach the backend acts as whoever ran `tkinfra login`
- [ ] Keycloak's browser login flow isn't implemented; the cache must be primed by `tkinfra login`
- [ ] No CI/deploy workflow (`.github/` does not exist yet)
