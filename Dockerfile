# Optimized Dockerfile for backend and fallback-ui services (project root)

# 1. ---- Base Node image
FROM node:20-slim AS base
WORKDIR /app

# 2. ---- Pruner ----
FROM base AS pruner
WORKDIR /app
# Copy config files first for better caching
COPY package.json package-lock.json turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/fallback-ui/package.json ./apps/fallback-ui/
COPY packages/ui/package.json ./packages/ui/
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=backend --scope=fallback-ui --scope=common-ui --docker

# 3. ---- Builder ----
FROM base AS builder
WORKDIR /app
# Copy package files first to cache npm install
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
COPY --from=pruner /app/turbo.json .
RUN npm ci
# Copy source code after dependencies are installed
COPY --from=pruner /app/out/full/ .
RUN npx turbo run build --filter=fallback-ui... --filter=backend...

# 4. ---- Runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy package files and install production deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci --production --omit=dev
# Copy built applications
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/fallback-ui/dist ./apps/fallback-ui/dist
EXPOSE 4000
RUN npm i -g bun
CMD ["bun", "apps/backend/dist/index.js"]
# CMD ["node", "apps/backend/dist/index.js"]