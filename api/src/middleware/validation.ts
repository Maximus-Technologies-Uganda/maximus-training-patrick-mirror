import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

import { validateBody as validateBodyTs, validateQuery as validateQueryTs } from "./validate";

export type Validator = (schema: ZodSchema) => RequestHandler;

export const validateBody: Validator = (schema) => validateBodyTs(schema);

export const validateQuery: Validator = (schema) => validateQueryTs(schema);


