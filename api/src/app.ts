import express from "express";
import cors from "cors";
import helmet from "helmet";
import { requestId as requestIdMiddleware } from "./middleware/requestId";
import { requestLogger } from "./middleware/logger";
import authRouter from "./core/auth/auth.routes";
import { errorHandler } from "./middleware/errorHandler";
import { createPostsRoutes } from "./core/posts/posts.routes";
import { createPostsController } from "./core/posts/posts.controller";
import { PostsService } from "./services/PostsService";
import type { IPostsRepository } from "./repositories/posts.repository";
import type { AppConfig } from "./config";
import { createHealthRouter } from "./routes/health";

import rateLimit from "express-rate-limit";
import path from "path";

export function createApp(config: AppConfig, repository: IPostsRepository) {
  const app = express();

  // Core Middleware (order matters)
  app.use(helmet());
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
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
  app.use(express.json({ limit: config.jsonLimit }));
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // Root - simple status JSON
  app.get("/", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Health Check
  app.use(createHealthRouter());

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


