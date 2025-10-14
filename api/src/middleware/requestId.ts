import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";

// Augment Express Request to include requestId for downstream handlers
declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
  }
}

export const requestId: RequestHandler = (req, res, next) => {
  const incoming = (req.get("X-Request-Id") || req.headers["x-request-id"]) as string | undefined;
  const value = typeof incoming === "string" && incoming.trim() ? incoming.trim() : randomUUID();
  req.requestId = value;
  res.setHeader("X-Request-Id", value);
  next();
};

export default requestId;


