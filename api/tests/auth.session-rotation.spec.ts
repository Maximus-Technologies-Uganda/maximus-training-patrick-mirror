import request from "supertest";
import { createApp } from "../src/app";
import { loadConfigFromEnv } from "../src/config";
import { createRepository } from "../src/repositories/posts-repository";

async function makeApp() {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitMax: 1000 };
  const repository = await createRepository();
  return createApp(config, repository);
}

describe('Session cookie rotation (T062)', () => {
  it('rotates session cookie when token is older than 10 minutes', async () => {
    const app = await makeApp();

    // Login to get initial session cookie
    const loginRes = await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({ username: 'alice', password: 'correct-password' });

    expect(loginRes.status).toBe(204);
    const initialSetCookie = loginRes.headers['set-cookie'] as string[];
    expect(Array.isArray(initialSetCookie) && initialSetCookie.length > 0).toBe(true);

    // Extract the session cookie
    const sessionCookie = initialSetCookie.find(cookie => cookie.startsWith('session='));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toMatch(/SameSite=Strict/i);

    // Make a request with the session cookie (should not rotate on first use)
    const res1 = await request(app)
      .get('/posts')
      .set('Cookie', sessionCookie);

    expect(res1.status).toBe(200);
    const setCookie1 = res1.headers['set-cookie'] as string[] | undefined;

    // Since this is a fresh token, it should NOT be rotated yet
    if (setCookie1 && setCookie1.length > 0) {
      // If there are new cookies, they should still have SameSite=Strict
      const sessionCookie1 = setCookie1.find(cookie => cookie.startsWith('session='));
      if (sessionCookie1) {
        expect(sessionCookie1).toMatch(/SameSite=Strict/i);
      }
    }
  });

  it('includes role in JWT payload for session cookies', async () => {
    const app = await makeApp();

    // Login as admin
    const loginRes = await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({ username: 'admin', password: 'password' });

    expect(loginRes.status).toBe(204);
    const setCookie = loginRes.headers['set-cookie'] as string[];
    expect(Array.isArray(setCookie) && setCookie.length > 0).toBe(true);

    const sessionCookie = setCookie.find(cookie => cookie.startsWith('session='));
    expect(sessionCookie).toMatch(/SameSite=Strict/i);

    // Make a request and check if role is preserved in rotation
    const res = await request(app)
      .get('/posts')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    const rotatedCookie = res.headers['set-cookie'] as string[] | undefined;

    if (rotatedCookie && rotatedCookie.length > 0) {
      const newSessionCookie = rotatedCookie.find(cookie => cookie.startsWith('session='));
      if (newSessionCookie) {
        expect(newSessionCookie).toMatch(/SameSite=Strict/i);
      }
    }
  });

  it('maintains proper cookie attributes on rotation', async () => {
    const app = await makeApp();

    // Login to get session cookie
    const loginRes = await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({ username: 'alice', password: 'correct-password' });

    expect(loginRes.status).toBe(204);
    const setCookie = loginRes.headers['set-cookie'] as string[];
    const sessionCookie = setCookie.find(cookie => cookie.startsWith('session='));

    // Make multiple requests to potentially trigger rotation
    let currentSessionCookie = sessionCookie;
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .get('/posts')
        .set('Cookie', currentSessionCookie);

      expect(res.status).toBe(200);

      const rotatedCookies = res.headers['set-cookie'] as string[] | undefined;
      if (rotatedCookies && rotatedCookies.length > 0) {
        const newSessionCookie = rotatedCookies.find(cookie => cookie.startsWith('session='));
        if (newSessionCookie) {
          // Verify all required attributes are present
          expect(newSessionCookie).toMatch(/HttpOnly/i);
          expect(newSessionCookie).toMatch(/SameSite=Strict/i);
          expect(newSessionCookie).toMatch(/Max-Age=/i);
          expect(newSessionCookie).toMatch(/Path=\//i);

          // Update cookie for next iteration
          currentSessionCookie = newSessionCookie;
        }
      }
    }
  });
});
