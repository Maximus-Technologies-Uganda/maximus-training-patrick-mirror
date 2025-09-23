import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import postsRouter from "./core/posts/posts.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Core Middleware (order matters)
app.use(helmet());
app.use(cors());
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

// Error Handler (must be last)
app.use(errorHandler);

export { app };
export default app;


