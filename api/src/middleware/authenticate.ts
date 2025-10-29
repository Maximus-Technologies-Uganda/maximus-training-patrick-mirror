import type { NextFunction, Request, RequestHandler, Response } from "express";

export interface HeaderAuthenticationOptions {
  headerName?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

const resolveHeaderValue = (request: Request, headerName: string): string | null => {
  const header = request.headers[headerName] ?? request.headers[headerName.toLowerCase()];
  if (Array.isArray(header)) {
    const first = header[0];
    return typeof first === "string" ? first : null;
  }
  if (typeof header === "string") {
    return header;
  }
  return null;
};

/**
 * Creates middleware that populates `req.user` from an incoming header value.
 * The middleware is intentionally lightweight and avoids performing any real
 * authentication; it simply exposes the supplied user identifier so that
 * downstream handlers can enforce authorization semantics. A missing or empty
 * header leaves `req.user` undefined.
 */
export const createHeaderAuthenticationMiddleware = (
  options: HeaderAuthenticationOptions = {},
): RequestHandler => {
  const headerName = options.headerName?.toLowerCase() ?? "x-user-id";

  return (req: Request, _res: Response, next: NextFunction) => {
    const rawValue = resolveHeaderValue(req, headerName);
    const value = typeof rawValue === "string" ? rawValue.trim() : "";

    if (value) {
      (req as AuthenticatedRequest).user = { id: value };
    } else {
      delete (req as AuthenticatedRequest).user;
    }

    next();
  };
};
