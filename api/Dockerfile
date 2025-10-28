# syntax=docker/dockerfile:1

FROM node:20 AS builder
WORKDIR /app

# Install API dependencies (context is the api/ directory)
COPY package*.json ./
RUN npm install --no-audit --no-fund --omit=optional

# Copy API source needed for the build
COPY . ./

# Build the API source
RUN npm run build


# ---- Runtime ----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Copy production node_modules and built artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Ensure OpenAPI spec is available at runtime where app expects it
# Compiled app resolves spec via path.join(__dirname, "..", "openapi.json") with __dirname at /app/dist/src → /app/dist/openapi.json
COPY --from=builder /app/openapi.json ./openapi.json

# All compiled JS (including lib/errors.js from errors.ts) is already in ./dist from the copy above.
# Do not attempt to copy source .js files that do not exist in TypeScript projects.

# Preserve package metadata for runtime tooling
COPY --from=builder /app/package.json ./package.json

EXPOSE 8080
# Use the non-root node user provided by the base image
USER node

# Start the server with Node explicitly
CMD ["node", "dist/server.js"]


