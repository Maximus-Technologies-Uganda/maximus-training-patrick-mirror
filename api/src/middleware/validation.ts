// Export validation helpers for controllers to invoke and format errors
// Thin wrappers that delegate to existing JS validators to keep single source of truth

export type Validator = (schema: any) => (req: any, res: any, next: any) => void;

export const validateBody: Validator = (schema: any) => {
  const js = require('./validate');
  return js.validateBody(schema);
};

export const validateQuery: Validator = (schema: any) => {
  const js = require('./validate');
  return js.validateQuery(schema);
};


