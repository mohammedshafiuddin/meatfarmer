# Dockerfile for backend service (project root)

# 1. ---- Base Node image
FROM node:20-slim AS base
WORKDIR /app

# 2. ---- Pruner ----
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=backend --scope=common-ui --docker

# 3. ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
COPY --from=pruner /app/turbo.json .
RUN npm install
RUN npx turbo build --filter=backend...

# 4. ---- Runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci --production
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
EXPOSE 4000
CMD ["node", "apps/backend/dist/index.js"]