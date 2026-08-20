# tkhq-ff — Feature Flag GUI

A web GUI for managing Turnkey (`tkhq/mono`) feature flags via the `tkinfra ff` CLI. Built with React + Vite (frontend) and Express + TypeScript (backend).

## Architecture

```
packages/
  frontend/   React + Vite + Tailwind SPA
  backend/    Express + TypeScript API server
docker-compose.yml
```

The backend proxies HTTP requests to `tkinfra ff` CLI commands, parses the output, and returns JSON to the frontend.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- `tkinfra` CLI installed and on your `$PATH`
- `OPERATOR_AGENT_PROTOCOL=grpc` when connecting to local gRPC (handled automatically by the backend)

## Local Development

```bash
# Install all dependencies
npm install

# Start both backend (port 3001) and frontend (port 3000) in watch mode
npm run dev
```

The frontend dev server proxies `/api/*` requests to `http://localhost:3001`, so no CORS issues during development.

Open `http://localhost:3000` in your browser.

### Backend only

```bash
npm run dev --workspace=packages/backend
```

### Frontend only

```bash
npm run dev --workspace=packages/frontend
```

## Docker (Production)

```bash
# Build and start both services
docker compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

The Docker setup uses nginx to serve the Vite production build and reverse-proxy `/api/*` to the backend container.

## API Reference

All endpoints accept a `?env=<local|dev|staging|prod>` query parameter (default: `local`).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/flags` | List all feature flags |
| `GET` | `/api/flags/:flag` | Get flag detail (orgs, products, etc.) |
| `POST` | `/api/flags/:flag/set` | Set enabled/rollout percent |
| `POST` | `/api/flags/:flag/org/allow` | Add org to allow list |
| `POST` | `/api/flags/:flag/org/disallow` | Add org to disallow list |
| `DELETE` | `/api/flags/:flag/org/:uuid` | Remove org from list |
| `POST` | `/api/flags/:flag/product/allow` | Add product rule (allow) |
| `POST` | `/api/flags/:flag/product/disallow` | Add product rule (disallow) |
| `DELETE` | `/api/flags/:flag/product` | Remove product rule |

### POST /api/flags/:flag/set

```json
{ "enabled": true, "percent": 50 }
```

### POST /api/flags/:flag/org/allow|disallow

```json
{ "orgId": "<uuid>" }
```

### POST /api/flags/:flag/product/allow|disallow

```json
{ "type": "enterprise", "subType": "scale" }
```

### DELETE /api/flags/:flag/product

Query params: `?type=enterprise&subType=scale`

## UI Features

- **Flag list**: table of all flags with enabled status, rollout %, allow/deny org counts
- **Flag detail panel**: slide-out panel with:
  - Global enable/disable toggle
  - Rollout % slider
  - Org allow/disallow lists (add/remove)
  - Product type rules (add/remove)
  - Raw CLI output (collapsible)
- **Search**: filter by flag name
- **Status filter**: show all / enabled only / disabled only
- **Env selector**: switch between `local`, `dev`, `staging`, `prod`
- **Optimistic UI**: pending states while CLI calls are in flight
- **Dark mode** by default

## IsAllowed Precedence (display reference)

1. global `enabled=false` → deny (no exceptions)
2. org in disallow list → deny
3. org in allow list → allow
4. product sub-type disallow → deny
5. product sub-type allow → allow
6. whole product-type disallow → deny
7. whole product-type allow → allow
8. rollout %: `FNV32a(orgID + ":" + featureID) % 100 < rolloutPercent`

## GitHub Actions

`.github/workflows/deploy.yml` triggers on push to `main` and:
1. Builds Docker images for frontend and backend
2. Pushes to GitHub Container Registry (`ghcr.io/justinformentin/tkhq-ff-{frontend,backend}`)
3. Tags with `latest` and the commit SHA

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `OPERATOR_AGENT_PROTOCOL` | `grpc` | Set automatically for tkinfra |
