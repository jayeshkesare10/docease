# ==============================================================================
# DOCEASE - Production Docker Multi-Stage Build
# Node.js 22+ (Native SQLite DatabaseSync Engine Support)
# ==============================================================================

# STAGE 1: Build Frontend and Backend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN npm --prefix client install
RUN npm --prefix server install

# Copy complete source code
COPY client/ ./client/
COPY server/ ./server/

# Build Backend (TypeScript -> JS) and Frontend (Vite -> dist)
RUN npm --prefix server run build
RUN npm --prefix client run build

# STAGE 2: Lightweight Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production server dependencies only
COPY server/package*.json ./server/
RUN npm --prefix server install --omit=dev

# Copy compiled backend and frontend bundles
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Ensure SQLite and Vault storage directories exist
RUN mkdir -p /app/server/data/vault_storage

EXPOSE 5000

CMD ["node", "server/dist/server.js"]
