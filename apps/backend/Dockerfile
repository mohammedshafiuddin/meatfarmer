# Dockerfile for backend service

# 1. ---- Base Node image
FROM node:20-slim AS base
WORKDIR /app

# 2. ---- Pruner ----
# This stage creates a pruned version of the monorepo that only contains
# the files and dependencies required to build the 'backend' and 'admin-ui' services.
FROM base AS pruner
WORKDIR /app
# Install turbo globally
RUN npm install -g turbo
# Copy all files from the context
COPY . .
# Prune the monorepo for the 'backend' and 'admin-ui' scopes
RUN turbo prune --scope=backend --scope=admin-ui --docker --scope=common-ui

# 3. ---- Builder ----
# This stage builds both the backend application and the admin-ui using the pruned files.
FROM base AS builder
WORKDIR /app

# Copy the pruned source files, package.json files, and lockfile
# to create a stand-alone build environment.
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json .
COPY --from=pruner /app/turbo.json .

# Install all dependencies (including dev) to build the applications
RUN npm install

# Build the backend application
RUN npx turbo build --filter=backend...

# Build the admin-ui for web
WORKDIR /app/apps/admin-ui
RUN npx expo export --platform web --output-dir web-build
# Return to the root for the next stage
WORKDIR /app

# 4. ---- Runner ----
# This is the final, lean production image.
FROM base AS runner
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy pruned package files and install only production dependencies
# The pruned output in /app/out/json contains the package.json files
# in their original directory structure.
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci --production

# Copy the built application from the builder stage
# The builder stage contains the entire pruned monorepo with build artifacts.
# We only copy the necessary built files.
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Copy the built admin-ui web files
COPY --from=builder /app/apps/admin-ui/web-build ./apps/backend/public/admin-ui-web

# The application in apps/backend/index.ts listens on port 4000
EXPOSE 4000

# The command to start the backend service
CMD ["node", "apps/backend/dist/index.js"]
