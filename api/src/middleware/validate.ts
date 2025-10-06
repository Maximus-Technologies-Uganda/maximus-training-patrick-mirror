import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

type RequestWithValidatedBody<Output> = { body: Output };
type RequestWithValidatedQuery<Output> = { validatedQuery: Output };

export function validateBody<Schema extends ZodSchema>(schema: Schema): RequestHandler {
  return async (req, _res, next) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      (req as typeof req & RequestWithValidatedBody<Schema["_output"]>).body = parsed;
      next();
    } catch (error) {
      const details = (error as { errors?: unknown })?.errors ?? undefined;
      next({ code: "validation_error", message: "Invalid request body", details });
    }
  };
}

export function validateQuery<Schema extends ZodSchema>(schema: Schema): RequestHandler {
  return async (req, _res, next) => {
    try {
      const parsed = await schema.parseAsync(req.query);
      (req as typeof req & RequestWithValidatedQuery<Schema["_output"]>).validatedQuery = parsed;
      next();
    } catch (error) {
      const details = (error as { errors?: unknown })?.errors ?? undefined;
      next({ code: "validation_error", message: "Invalid query parameters", details });
    }
  };
}


