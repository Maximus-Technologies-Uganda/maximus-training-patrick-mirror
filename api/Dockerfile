# syntax=docker/dockerfile:1

FROM node:20 AS builder
WORKDIR /repo

# Copy monorepo manifests so npm can resolve workspace dependencies
COPY package.json package-lock.json ./
COPY api/package.json ./api/package.json

# Install only the API workspace dependencies
RUN npm ci --workspace api --include-workspace-root=false --omit=optional

# Copy API source needed for the build
COPY api/tsconfig.json ./api/tsconfig.json
COPY api/openapi.json ./api/openapi.json
COPY api/src ./api/src

# Build the API source
WORKDIR /repo/api
RUN npm run build
RUN npm prune --omit=dev --omit=optional


# ---- Runtime ----
FROM gcr.io/distroless/nodejs20
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Copy production node_modules and built artifacts
COPY --from=builder /repo/api/node_modules ./node_modules
COPY --from=builder /repo/api/dist ./dist

# Ensure OpenAPI spec is available at runtime where app expects it
# App resolves spec via path.join(__dirname, "..", "openapi.json") → /app/openapi.json
COPY --from=builder /repo/api/openapi.json ./openapi.json

# Include JS utilities not emitted by TypeScript build (used by errorHandler)
COPY --from=builder /repo/api/src/lib/errors.js ./dist/lib/errors.js

# Preserve package metadata for runtime tooling
COPY --from=builder /repo/api/package.json ./package.json

EXPOSE 8080
USER nonroot

# distroless/nodejs images have entrypoint ["node"], so we only provide the script path
CMD ["dist/server.js"]


