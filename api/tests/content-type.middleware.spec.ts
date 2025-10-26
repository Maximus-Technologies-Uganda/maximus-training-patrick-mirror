import type { NextFunction, Request, Response } from "express";
import { requireJsonContentType } from "../src/middleware/contentType";

describe("requireJsonContentType middleware", () => {
  function createMocks(
    method: string,
    contentType?: string,
    body: Record<string, unknown> = {}
  ) {
    const headers: Record<string, string> = {};
    if (contentType) {
      headers["content-type"] = contentType;
    }

    const req = {
      method,
      headers,
      body,
    } as unknown as Request;

    const json = jest.fn();
    const res = {
      status: jest.fn(),
      json,
      get: jest.fn(),
      locals: {},
    } as unknown as Response;

    (res.status as jest.Mock).mockReturnValue(res);

    const next = jest.fn() as NextFunction;

    return { req, res, next, status: res.status as jest.Mock, json };
  }

  it("allows exact application/json media type with charset parameter", () => {
    const { req, res, next } = createMocks("POST", "application/json; charset=utf-8");

    requireJsonContentType(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("rejects media types that only start with application/json", () => {
    const { req, res, next, status, json } = createMocks(
      "POST",
      "application/jsonp"
    );

    requireJsonContentType(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(415);
    expect(json).toHaveBeenCalledWith({
      code: "UNSUPPORTED_MEDIA_TYPE",
      message: "Content-Type must be application/json for mutating requests",
    });
  });

  it("sets Cache-Control: no-store on 415 responses (T087)", () => {
    const { req, res, next, status, json } = createMocks(
      "POST",
      "application/jsonp"
    );

    requireJsonContentType(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(415);
  });

  it("includes requestId in 415 response when available", () => {
    const { req, res, next, status, json } = createMocks(
      "POST",
      "application/jsonp"
    );

    // Set up requestId on the request
    (req as unknown as { requestId: string }).requestId = "test-request-123";

    requireJsonContentType(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(415);
    expect(json).toHaveBeenCalledWith({
      code: "UNSUPPORTED_MEDIA_TYPE",
      message: "Content-Type must be application/json for mutating requests",
      requestId: "test-request-123",
    });
  });
});
