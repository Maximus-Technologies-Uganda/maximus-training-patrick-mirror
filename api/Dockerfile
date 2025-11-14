# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.x --activate

# Copy everything needed to build
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY src ./src

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm run build 2>/dev/null || pnpm exec tsc --outDir dist

# Final stage
FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.x --activate

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Copy runtime dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy remaining assets
COPY openapi.json ./

USER node
EXPOSE 8080

CMD ["node", "dist/server.js"]


