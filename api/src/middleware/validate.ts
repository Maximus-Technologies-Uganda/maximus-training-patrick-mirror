import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

/**
 * validate: Creates an Express middleware that validates req.body against a Zod schema.
 * On success, it calls next(); on failure, it forwards the error to the error handler.
 */
export function validate(schema: ZodSchema): RequestHandler {
  return async (req, _res, next) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}


