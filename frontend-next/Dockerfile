# Multi-stage Dockerfile for Next.js application optimized for Google Cloud Run

# Stage 1: Dependencies
FROM node:20-bookworm-slim AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY frontend-next/package.json ./frontend-next/package.json
ENV NODE_OPTIONS=--max-old-space-size=2048
RUN npm ci --omit=optional --no-audit --no-fund --prefer-offline --progress=false

# Stage 2: Builder
FROM node:20-bookworm-slim AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/package.json ./package.json
COPY frontend-next ./frontend-next
WORKDIR /repo/frontend-next
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_OPTIONS=--max-old-space-size=2048
RUN npm run build

# Stage 3: Runner - Production Image
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid 1001 nextjs
# Copy only the necessary standalone files from the builder stage
# The destination `./` is crucial for placing files in `/app`
COPY --from=builder --chown=nextjs:nodejs /repo/frontend-next/.next/standalone ./
# Place static assets relative to the standalone server location
COPY --from=builder --chown=nextjs:nodejs /repo/frontend-next/.next/static ./frontend-next/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/frontend-next/public ./frontend-next/public
WORKDIR /app/frontend-next
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
USER nextjs
EXPOSE 3000
# Healthcheck to see if the server is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
  CMD curl -fsS http://localhost:3000/ || exit 1
# Start the application (Next.js standalone outputs server.js at project root)
CMD ["node", "server.js"]
