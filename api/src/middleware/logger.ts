import type { RequestHandler } from "express";

export const requestLogger: RequestHandler = (req, res, next) => {
  res.on("finish", () => {
    const event = {
      level: "info",
      message: "request completed",
      method: req.method,
      path: (req as unknown as { originalUrl?: string }).originalUrl || req.path,
      status: res.statusCode,
      requestId: (req as unknown as { requestId?: string }).requestId,
    };
    console.log(JSON.stringify(event));
  });
  next();
};

export default requestLogger;


