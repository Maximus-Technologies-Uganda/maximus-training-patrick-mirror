import { validateEnvOnBoot } from "../src/config/env";

describe('Env validation (T076)', () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origSecret = process.env.SESSION_SECRET;
  afterEach(() => {
    process.env.NODE_ENV = origNodeEnv;
    process.env.SESSION_SECRET = origSecret;
  });

  it('does not throw in non-production', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.SESSION_SECRET;
    expect(() => validateEnvOnBoot()).not.toThrow();
  });

  it('throws in production when required var missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SESSION_SECRET;
    expect(() => validateEnvOnBoot()).toThrow(/SESSION_SECRET/);
  });
});

