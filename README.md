# tkhq-ff — Feature Flag Admin GUI

Internal admin tool for managing Turnkey feature flags via gRPC.

## Architecture

```
tkhq-ff/
├── backend/          Express REST→gRPC bridge (Node.js 20 + TypeScript)
│   └── src/grpc/     gRPC client + placeholder proto file
├── frontend/         React 19 + Vite + Tailwind CSS + Radix UI (dark theme)
├── Dockerfile        Multi-stage build: frontend → backend serves static
├── docker-compose.yml
└── .github/workflows/deploy.yml  → ghcr.io on push to main
```

The backend translates REST calls into gRPC requests to `OperatorAgentService`. No direct database access — all reads and writes go through gRPC.

## Quick Start (Development)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set OPERATOR_AGENT_GRPC_HOST and OPERATOR_AGENT_GRPC_PORT
npm install
npm run dev
# Runs on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173 (proxies /api → localhost:3001)
```

## Production (Docker)

```bash
docker compose up --build
# Access at http://localhost:3001
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OPERATOR_AGENT_GRPC_HOST` | `localhost` | gRPC server hostname |
| `OPERATOR_AGENT_GRPC_PORT` | `9090` | gRPC server port |
| `OPERATOR_AGENT_PROTOCOL` | `grpc` | Protocol (always `grpc`) |
| `PORT` | `3001` | HTTP port for backend |

## REST API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/flags` | List all non-deprecated feature flags |
| `GET` | `/api/flags/:flag` | Get flag details (global settings + org/product rules) |
| `PUT` | `/api/flags/:flag` | Set `enabled` + `rollout_percent` |
| `POST` | `/api/flags/:flag/orgs` | Add org allow/deny (`{ org_id, enabled }`) |
| `DELETE` | `/api/flags/:flag/orgs/:org_id` | Remove org override |
| `POST` | `/api/flags/:flag/products` | Add product allow/deny (`{ product_type, product_sub_type, enabled }`) |
| `DELETE` | `/api/flags/:flag/products/:type/:sub_type` | Remove product rule |

## gRPC Integration

The backend uses `@grpc/grpc-js` + `@grpc/proto-loader` to load the proto **dynamically at runtime** from `backend/src/grpc/operator_agent.proto` (copied to `dist/grpc/` at build time).

**To connect to the real gRPC service:**

1. Replace `backend/src/grpc/operator_agent.proto` with the actual proto from:
   `tkhq/mono/proto/services/operator_agent/v1/operator_agent.proto`

2. If the package name differs (e.g., `services.operator_agent.v1` vs `operator_agent.v1`), update the descriptor lookup in `backend/src/grpc/client.ts`:
   ```ts
   const OperatorAgentService = protoDescriptor.<package.path>.OperatorAgentService;
   ```

3. For mTLS, replace `grpc.credentials.createInsecure()` in `client.ts` with `grpc.credentials.createSsl(rootCerts, privateKey, certChain)`.

## Deprecated Flags (hidden from UI)

`FEATURE_FLAG_AUTH_PROXY`, `FEATURE_FLAG_ACCOUNT_SETTINGS`, `FEATURE_FLAG_CREATE_PRIVATE_KEY`, `FEATURE_FLAG_OAUTH`, `FEATURE_FLAG_SEND_EMAILS`, `FEATURE_FLAG_SES_EMAIL`, `FEATURE_FLAG_SUB_ORGS_UI`, `FEATURE_FLAG_APP_PROOFS`

These are filtered out in `backend/src/routes/flags.ts`.

## TODOs

- [ ] Replace placeholder proto with actual proto from `tkhq/mono`
- [ ] Update proto descriptor path in `client.ts` if package name differs
- [ ] Configure mTLS credentials for production gRPC connection
- [ ] Add GitHub Secrets (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`) and uncomment deploy job in `deploy.yml`
- [ ] Add authentication/authorization layer (currently unauthenticated)
- [ ] Add `VITE_API_URL` env var support for non-proxy frontend deployments
