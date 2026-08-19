# ─────────────────────────────────────────────
# Stage 1: Build frontend
# ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Build backend
# ─────────────────────────────────────────────
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

# ─────────────────────────────────────────────
# Stage 3: Production image
# ─────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Copy compiled backend + production deps
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules

# Copy proto file into dist so it's available at runtime
# (backend loads it dynamically via @grpc/proto-loader)
COPY --from=backend-builder /app/backend/src/grpc/operator_agent.proto ./dist/grpc/operator_agent.proto

# Copy compiled frontend assets into location the backend will serve
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
