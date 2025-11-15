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

# Copy only the necessary production artifacts from builder
COPY --from=builder /app/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/api/node_modules ./api/node_modules
COPY package.json ./
COPY api/package.json ./api/package.json

USER node
EXPOSE 8080

# Set NODE_PATH to resolve api's node_modules
ENV NODE_PATH=/app/node_modules:/app/api/node_modules

CMD ["node", "dist/server.js"]


