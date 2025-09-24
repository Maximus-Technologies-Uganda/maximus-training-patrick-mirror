import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

export function validateBody(schema: ZodSchema): RequestHandler {
  return async (req, _res, next) => {
    try {
      const parsed = await (schema as any).parseAsync(req.body);
      (req as any).body = parsed;
      next();
    } catch (error) {
      const details = (error as any)?.errors ?? undefined;
      next({ code: "validation_error", message: "Invalid request body", details } as any);
    }
  };
}

export function validateQuery(schema: ZodSchema): RequestHandler {
  return async (req, _res, next) => {
    try {
      const parsed = await (schema as any).parseAsync(req.query);
      (req as any).validatedQuery = parsed;
      next();
    } catch (error) {
      const details = (error as any)?.errors ?? undefined;
      next({ code: "validation_error", message: "Invalid query parameters", details } as any);
    }
  };
}


