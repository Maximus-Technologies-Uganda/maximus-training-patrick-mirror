import { assertCorsProdInvariants } from "../src/config/cors";

describe('CORS invariants (T103)', () => {
  const orig = { NODE_ENV: process.env.NODE_ENV, ALLOW_CREDENTIALS: process.env.ALLOW_CREDENTIALS, CORS_ORIGINS: process.env.CORS_ORIGINS };
  afterEach(() => {
    process.env.NODE_ENV = orig.NODE_ENV;
    process.env.ALLOW_CREDENTIALS = orig.ALLOW_CREDENTIALS;
    process.env.CORS_ORIGINS = orig.CORS_ORIGINS;
  });

  it('throws in production when ALLOW_CREDENTIALS=true and CORS_ORIGINS=*', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_CREDENTIALS = 'true';
    process.env.CORS_ORIGINS = '*';
    expect(() => assertCorsProdInvariants()).toThrow();
  });

  it('does not throw for safe combinations', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_CREDENTIALS = 'true';
    process.env.CORS_ORIGINS = 'http://example.com';
    expect(() => assertCorsProdInvariants()).not.toThrow();
  });
});

