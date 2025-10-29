import errorHandler from '../src/middleware/errorHandler';
import type { Request, Response, NextFunction } from 'express';

describe('errorHandler middleware', () => {
  it('formats error response with 500 when unknown', async () => {
    const req = {
      get: jest.fn(() => undefined)
    } as unknown as Request;

    type MockRes = { statusCode: number; body: unknown; get: (h: string) => string | undefined; status: (c: number) => MockRes; json: (b: unknown) => MockRes };
    const res: MockRes = {
      statusCode: 0,
      body: null,
      get: jest.fn(() => undefined),
      status(c: number){ this.statusCode=c; return this; },
      json(b: unknown){ this.body=b; return this; }
    };
    const next = jest.fn() as NextFunction;
    errorHandler(new Error('boom'), req, res as unknown as Response, next);
    expect(res.statusCode).toBe(500);
    expect(typeof res.body).toBe('object');
  });
});
