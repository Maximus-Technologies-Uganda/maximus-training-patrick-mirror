/**
 * DEV-543 / T027 — Request-Id middleware unit tests
 * Spec Ref: specs/spec-auth-ownership-observability/spec.md §FR-031
 * Tasks Ref: specs/spec-auth-ownership-observability/tasks.md T027
 */

import type { Request, Response, NextFunction } from "express";
// Planned middleware path and export (to be implemented in T030)
import { requestId } from "../src/middleware/requestId";

function createMockReqRes(initialHeaders?: Record<string, string>) {
  const lower = Object.fromEntries(
    Object.entries(initialHeaders || {}).map(([k, v]) => [k.toLowerCase(), v])
  );
  const req: Partial<Request> & {
    requestId?: string;
    headers: Record<string, string>;
    get(name: string): string | undefined;
  } = {
    headers: lower,
    get(name: string) {
      return this.headers[name.toLowerCase()];
    },
  };
  const resHeaders: Record<string, string> = {};
  const res: Partial<Response> & {
    setHeader: (n: string, v: string) => void;
    getHeader: (n: string) => string | undefined;
  } = {
    setHeader: (n: string, v: string) => {
      resHeaders[n.toLowerCase()] = v;
    },
    getHeader: (n: string) => resHeaders[n.toLowerCase()],
  };
  const next = jest.fn() as NextFunction;
  return { req: req as Request, res: res as Response, next };
}

describe("requestId middleware", () => {
  test("uses existing X-Request-Id when header is present and attaches to req", () => {
    const existingId = "incoming-id-123";
    const { req, res, next } = createMockReqRes({ "X-Request-Id": existingId });

    requestId(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as unknown as { requestId?: string }).requestId).toBe(existingId);
  });

  test("generates a new id when header is missing and attaches to req", () => {
    const { req, res, next } = createMockReqRes();

    requestId(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const attached = (req as unknown as { requestId?: string }).requestId;
    expect(typeof attached).toBe("string");
    expect(attached).toBeTruthy();

    // Optional uniqueness check across invocations
    const { req: req2, res: res2, next: next2 } = createMockReqRes();
    requestId(req2, res2, next2);
    const attached2 = (req2 as unknown as { requestId?: string }).requestId;
    expect(attached2).not.toBe(attached);
  });
});


