import errorHandler from '../src/middleware/errorHandler';

describe('errorHandler middleware', () => {
  it('formats error response with 500 when unknown', async () => {
    const req: Record<string, unknown> = {};
    type MockRes = { statusCode: number; body: unknown; status: (c: number) => MockRes; json: (b: unknown) => MockRes };
    const res: MockRes = {
      statusCode: 0,
      body: null,
      status(c: number){ this.statusCode=c; return this; },
      json(b: unknown){ this.body=b; return this; }
    };
    const next = jest.fn();
    errorHandler(new Error('boom'), req, res, next);
    expect(res.statusCode).toBe(500);
    expect(typeof res.body).toBe('object');
  });
});
