# syntax=docker/dockerfile:1

FROM node:20 AS builder
WORKDIR /app

# Install dependencies (skip optional native deps to keep image small and builds fast)
COPY package*.json ./
RUN npm ci --omit=optional

# Build TypeScript
COPY tsconfig.json ./
COPY src ./src
COPY openapi.json ./openapi.json
RUN npx tsc -p tsconfig.json

# Prune dev and optional dependencies for runtime
RUN npm prune --omit=dev --omit=optional

# ---- Runtime ----
FROM gcr.io/distroless/nodejs20
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Copy production node_modules and built artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Ensure OpenAPI spec is available at runtime where app expects it
# App resolves spec via path.join(__dirname, "..", "openapi.json") → /app/openapi.json
COPY --from=builder /app/openapi.json ./openapi.json

# Include JS utilities not emitted by TypeScript build (used by errorHandler)
COPY --from=builder /app/src/lib/errors.js ./dist/lib/errors.js

EXPOSE 8080
USER nonroot

# distroless/nodejs images have entrypoint ["node"], so we only provide the script path
CMD ["dist/server.js"]


