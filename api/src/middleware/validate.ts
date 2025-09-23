import type { RequestHandler } from "express";
// Use a structural type to avoid coupling to a specific zod instance
type BodySchema = {
  parseAsync: (input: unknown) => Promise<unknown>;
};

/**
 * validate: Creates an Express middleware that validates req.body against a Zod schema.
 * On success, it calls next(); on failure, it forwards the error to the error handler.
 */
export function validate(schema: BodySchema): RequestHandler {
  return async (req, _res, next) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      const details = (error as any)?.errors ?? undefined;
      next({ code: "validation_error", message: "Invalid request body", details } as any);
    }
  };
}


