# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.x --activate

# Copy package files from root
COPY package.json pnpm-lock.yaml ./

# Copy API source files
COPY api/tsconfig.json api/package.json api/src ./api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the API
RUN cd api && npm run build

# Final stage
FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.x --activate

# Copy built artifacts from builder
COPY --from=builder /app/api/dist ./dist
COPY package.json pnpm-lock.yaml ./

# Copy API package.json for dependencies
COPY api/package.json ./

# Install runtime dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy OpenAPI spec
COPY api/openapi.json ./

USER node
EXPOSE 8080

CMD ["node", "dist/server.js"]


