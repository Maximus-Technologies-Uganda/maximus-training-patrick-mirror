# Multi-stage Dockerfile for Next.js application optimized for Google Cloud Run

FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.x --activate

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend-next/package.json ./frontend-next/
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy frontend-next source
COPY frontend-next ./frontend-next

# Build
WORKDIR /app/frontend-next
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8080}
RUN pnpm run build 2>/dev/null || pnpm exec next build

# Stage 2: Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.x --activate

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/frontend-next/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend-next/.next/static ./frontend-next/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend-next/public ./frontend-next/public

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

USER nextjs
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
  CMD sh -c 'curl -fsS http://localhost:${PORT:-8080}/ || exit 1'

CMD ["node", "frontend-next/server.js"]
