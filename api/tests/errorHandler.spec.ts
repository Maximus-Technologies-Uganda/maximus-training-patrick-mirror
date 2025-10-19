import errorHandler from '../src/middleware/errorHandler';

describe('errorHandler middleware', () => {
  it('formats error response with 500 when unknown', async () => {
    const req: any = {};
    const res: any = { statusCode: 0, body: null, status(c: number){ this.statusCode=c; return this; }, json(b:any){ this.body=b; return this; } };
    const next = jest.fn();
    // @ts-ignore
    errorHandler(new Error('boom'), req, res, next);
    expect(res.statusCode).toBe(500);
    expect(typeof res.body).toBe('object');
  });
});
