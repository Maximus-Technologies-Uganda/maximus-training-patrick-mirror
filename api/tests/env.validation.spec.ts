import { validateEnvOnBoot } from "../src/config/env";

describe('Env validation (T076)', () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origSecret = process.env.SESSION_SECRET;
  afterEach(() => {
    if (typeof origNodeEnv === 'undefined') {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = origNodeEnv;
    }

    if (typeof origSecret === 'undefined') {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = origSecret;
    }
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

  it('passes when required vars are defined, even if empty string', () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = '';
    expect(() => validateEnvOnBoot()).not.toThrow();
  });
});

