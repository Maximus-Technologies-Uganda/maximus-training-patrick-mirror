import express from "express";
import cors from "cors";
import helmet from "helmet";
// import morgan from "morgan";
import { requestId as requestIdMiddleware } from "./middleware/requestId";
import { requestLogger } from "./middleware/logger";
import authRouter from "./core/auth/auth.routes";
import { errorHandler } from "./middleware/errorHandler";
import { createPostsRoutes } from "./core/posts/posts.routes";
import { createPostsController } from "./core/posts/posts.controller";
import { PostsService } from "./services/PostsService";
import type { IPostsRepository } from "./repositories/posts.repository";
import type { AppConfig } from "./config";
import { requireJsonContentType, requireJsonAccept } from "./middleware/contentType";
import { stripIdentityFields } from "./middleware/stripIdentity";
import { corsHeaders, corsPreflight } from "./middleware/cors";
import { securityHeaders } from "./middleware/securityHeaders";
import { assertCorsProdInvariants } from "./config/cors";
import { verifyFirebaseIdToken } from "./middleware/firebaseAuth";
import { readOnlyGuard } from "./middleware/readOnly";

import { createRateLimiter as createAppRateLimiter } from "./middleware/rateLimit";
import path from "path";

/**
 * Handle CORS preflight OPTIONS requests
 * Extracted for better stack traces and testability
 */
function handleCorsPreflightRequest(config: AppConfig) {
  const preflightHandler = corsPreflight(config);
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method === "OPTIONS") {
      return preflightHandler(req, res, next);
    }
    next();
  };
}

export function createApp(config: AppConfig, repository: IPostsRepository) {
  // Validate critical production invariants before wiring middleware (T103)
  assertCorsProdInvariants();
  const app = express();

  // Generate request identifiers before any middleware can short-circuit the pipeline
  app.use(requestIdMiddleware);

  // Core Middleware (order matters)
  app.use(helmet());

  // Custom security headers (T050, T067)
  app.use(securityHeaders);

  // CORS preflight handler for all routes (T031, T061, T069)
  app.use(handleCorsPreflightRequest(config));

  // CORS headers for normal requests (T031, T061, T069)
  app.use(corsHeaders(config));

  // Fallback CORS for compatibility
  const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );

  const limiter = createAppRateLimiter({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
  });
  app.use(express.json({ limit: config.jsonLimit }));

  // Strip privileged identity fields from client payloads (T104)
  app.use(stripIdentityFields);

  // Content-Type and Accept validation (T032, T068)
  app.use(requireJsonContentType);
  app.use(requireJsonAccept);
  // T036: Read-only guard blocks mutating methods with 503 when READ_ONLY=true
  app.use(readOnlyGuard);

  app.use(requestLogger);

  // Root - simple status JSON
  app.get("/", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Health Check
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Feature Routes
  app.use("/auth", authRouter);
  const postsService = new PostsService(repository);
  const postsController = createPostsController(postsService);
  const postsRouter = createPostsRoutes(postsController, { rateLimiter: limiter });
  // For write operations on /posts, prefer Firebase bearer if provided; otherwise fallback to cookie session
  // Apply the rate limiter after authentication so per-user keys are honoured when available.
  app.use("/posts", verifyFirebaseIdToken, postsRouter);

  // In development, expose OpenAPI JSON for tests
  app.get("/openapi.json", (_req, res) => {
    const specPath = path.join(__dirname, "..", "openapi.json");
    res.set("Cache-Control", "no-store");
    res.type("application/json");
    res.sendFile(specPath);
  });

  // Error Handler (must be last)
  app.use(errorHandler);

  return app;
}

// Backwards-compatible default export for environments that import an app instance
import { loadConfigFromEnv } from "./config";
import { InMemoryPostsRepository } from "./repositories/posts.repository";
const defaultConfig = loadConfigFromEnv();
const defaultRepository = new InMemoryPostsRepository() as unknown as IPostsRepository;
const app = createApp(defaultConfig, defaultRepository);
export { app };
export default app;

