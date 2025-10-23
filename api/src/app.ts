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

import rateLimit from "express-rate-limit";
import path from "path";

// New production hardening middleware
import { securityHeaders } from "./middleware/securityHeaders";
import { corsVaryHeader } from "./middleware/cors";
import { requireJsonContentType } from "./middleware/contentType";

export function createApp(config: AppConfig, repository: IPostsRepository) {
  const app = express();

  // Core Middleware (order matters)
  // 1. CORS preflight handler FIRST (completely bypass all other middleware for OPTIONS)
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowsWildcardOrigin = allowedOrigins.includes('*');

  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      // Handle preflight immediately - inline implementation to avoid any middleware interference
      const origin = req.headers.origin;
      const requestMethod = req.headers['access-control-request-method'];
      const requestHeaders = req.headers['access-control-request-headers'];

      // Build Vary header
      const varyComponents = ['Origin'];
      if (requestMethod) varyComponents.push('Access-Control-Request-Method');
      if (requestHeaders) varyComponents.push('Access-Control-Request-Headers');
      res.setHeader('Vary', varyComponents.join(', '));

      // Set CORS headers
      if (origin && (allowedOrigins.includes(origin) || allowsWildcardOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-CSRF-Token, X-Request-Id, Content-Type');
      res.setHeader('Access-Control-Max-Age', '600');
      res.setHeader('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After, X-Request-Id');

      // Send 204 and end - do NOT call next()
      return res.status(204).end();
    }
    next();
  });

  // 2. Security headers baseline (skip for OPTIONS - already handled above)
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      return next(); // OPTIONS already handled, skip helmet
    }
    helmet()(req, res, next);
  });

  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      return next(); // OPTIONS already handled, skip security headers
    }
    securityHeaders(req, res, next);
  });

  // 3. CORS for normal requests (NOT for OPTIONS - already handled above)
  // Apply cors() only to non-OPTIONS requests
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      return next(); // Already handled by preflight middleware above
    }
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        if (allowsWildcardOrigin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(null, false);
      },
      credentials: true,
    })(req, res, next);
  });
  app.use(corsVaryHeader());

  // 4. Rate limiting (after CORS, so preflight bypasses it)
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // 5. Request tracking (must occur before validators that rely on requestId)
  app.use(requestIdMiddleware);

  // 6. Body parsing
  app.use(express.json({ limit: config.jsonLimit }));

  // 7. Content-Type validation (after body parsing, before routes)
  app.use(requireJsonContentType);
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
  app.use("/posts", createPostsRoutes(postsController));

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


