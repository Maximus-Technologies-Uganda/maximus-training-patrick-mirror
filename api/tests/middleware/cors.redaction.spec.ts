import type { Request, Response } from 'express';
import { corsHeaders, corsPreflight } from '../../src/middleware/cors';
import { REDACTED } from '../../src/logging/redaction';

function createResponse() {
  const headers: Record<string, unknown> = {};
  const res: Partial<Response> & { locals: Record<string, string> } = {
    locals: { requestId: 'req-123' },
    setHeader: jest.fn((name: string, value: unknown) => {
      headers[name] = value;
    }),
    getHeader: jest.fn((name: string) => headers[name] as any),
    json: jest.fn(),
    end: jest.fn(),
  };

  res.status = jest.fn().mockImplementation(() => res as Response);

  return res as Response;
}

describe('cors middleware logging redaction', () => {
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    CORS_ORIGINS: process.env.CORS_ORIGINS,
    ALLOW_NULL_ORIGIN: process.env.ALLOW_NULL_ORIGIN,
  };

  afterEach(() => {
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.CORS_ORIGINS = originalEnv.CORS_ORIGINS;
    process.env.ALLOW_NULL_ORIGIN = originalEnv.ALLOW_NULL_ORIGIN;
    jest.restoreAllMocks();
  });

  it('sanitizes wildcard warnings during preflight handling', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'https://prod.example.com,mailto:user@example.com,*';

    const preflight = corsPreflight({} as any);
    const res = createResponse();
    const req = {
      headers: { origin: 'https://prod.example.com' },
      requestId: 'req-123',
    } as unknown as Request;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    preflight(req, res, jest.fn());

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const [payload] = consoleSpy.mock.calls[0];
    expect(typeof payload).toBe('string');
    const parsed = JSON.parse(payload as string);
    expect(parsed.context).toBe('cors-preflight');
    expect(parsed.configuredOrigins.some((value: string) => value.includes(REDACTED))).toBe(true);
    expect(JSON.stringify(parsed)).not.toContain('user@example.com');
  });

  it('sanitizes wildcard warnings during normal header handling', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'https://prod.example.com,mailto:user@example.com,*';

    const headers = corsHeaders({} as any);
    const res = createResponse();
    const req = {
      headers: { origin: 'https://prod.example.com' },
      requestId: 'req-123',
    } as unknown as Request;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    headers(req, res, jest.fn());

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const [payload] = consoleSpy.mock.calls[0];
    expect(typeof payload).toBe('string');
    const parsed = JSON.parse(payload as string);
    expect(parsed.context).toBe('cors-headers');
    expect(parsed.configuredOrigins.some((value: string) => value.includes(REDACTED))).toBe(true);
    expect(JSON.stringify(parsed)).not.toContain('user@example.com');
  });
});
