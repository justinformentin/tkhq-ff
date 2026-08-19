FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json ./
COPY packages/frontend/package.json ./packages/frontend/

# Install deps
RUN npm install --workspace=packages/frontend

# Copy source
COPY packages/frontend ./packages/frontend

# Build
RUN npm run build --workspace=packages/frontend

# --- Runtime: nginx ---
FROM nginx:alpine

COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
