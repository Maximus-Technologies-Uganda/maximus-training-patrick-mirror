import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import postsRouter from "./core/posts/posts.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Core Middleware (order matters)
app.use(helmet());
app.use(cors());
// Default limiter from quality gate workflow
import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.use(express.json());
app.use(morgan("dev"));

// Health Check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Feature Routes
app.use("/posts", postsRouter);

// In development, expose OpenAPI JSON for tests
import path from "path";
app.get("/openapi.json", (_req, res) => {
  const specPath = path.join(__dirname, "..", "openapi.json");
  res.set("Cache-Control", "no-store");
  res.type("application/json");
  res.sendFile(specPath);
});

// Error Handler (must be last)
app.use(errorHandler);

export { app };
export default app;


