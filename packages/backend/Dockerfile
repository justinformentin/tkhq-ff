FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json ./
COPY packages/backend/package.json ./packages/backend/

# Install deps
RUN npm install --workspace=packages/backend

# Copy source
COPY packages/backend ./packages/backend

# Build
RUN npm run build --workspace=packages/backend

# --- Runtime ---
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/package.json ./

RUN npm install --production

EXPOSE 3001

CMD ["node", "dist/index.js"]
