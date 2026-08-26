# ─────────────────────────────────────────────
# Stage 1: Build frontend
# ─────────────────────────────────────────────
FROM node:22-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Build backend
# ─────────────────────────────────────────────
FROM node:22-slim AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# ─────────────────────────────────────────────
# Stage 3: Production image
# ─────────────────────────────────────────────
FROM node:22-slim AS production
WORKDIR /app

# Backend compiled output at /app/backend/dist
# __dirname=/app/backend/dist → ../../frontend/dist=/app/frontend/dist ✓
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
# Protos are loaded at runtime by @grpc/proto-loader — preserve dir structure
COPY --from=backend-builder /app/backend/src/grpc/proto ./backend/dist/grpc/proto
# Frontend static assets served by backend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
USER 1000:1000

CMD ["node", "backend/dist/index.js"]
