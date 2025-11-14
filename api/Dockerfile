# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.x --activate

# Copy package files from root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy API source files (preserving the directory structure)
COPY api/ ./api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the API - use pnpm exec to access node_modules/.bin
RUN cd api && pnpm exec tsc -p tsconfig.json

# Final stage
FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.x --activate

# Copy built artifacts from builder
COPY --from=builder /app/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy API package.json for reference
COPY api/package.json ./api/

# Copy OpenAPI spec
COPY api/openapi.json ./

USER node
EXPOSE 8080

CMD ["node", "dist/server.js"]


