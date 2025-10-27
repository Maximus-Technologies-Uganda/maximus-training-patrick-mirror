import type { RequestHandler } from "express";

export const requestLogger: RequestHandler = (req, res, next) => {
  res.on("finish", () => {
    // Structured audit logging is handled in dedicated modules; suppress general console logging here per T066
  });
  next();
};

export default requestLogger;


