import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { PASSWORD, sessionCookieHeader } from './support/http.js';
import { useTestApp } from './support/testApp.js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function expiresAt(cookieHeader) {
  return Date.parse(cookieHeader.match(/Expires=([^;]+)/)[1]);
}

describe('the session cookie', () => {
  const context = useTestApp();

  it('is httpOnly, SameSite=Lax, and lasts 30 days', async () => {
    const response = await request(context.app)
      .post('/api/auth/signup')
      .send({ email: 'cookie@example.com', password: PASSWORD });
    const cookie = sessionCookieHeader(response);

    expect(cookie).toMatch(/; HttpOnly/);
    expect(cookie).toMatch(/; SameSite=Lax/);
    expect(expiresAt(cookie)).toBeGreaterThan(Date.now() + THIRTY_DAYS_MS - 60_000);
    expect(expiresAt(cookie)).toBeLessThanOrEqual(Date.now() + THIRTY_DAYS_MS);
  });

  it('is extended while the tracker is in use', async () => {
    const browser = request.agent(context.app);
    const signup = await browser
      .post('/api/auth/signup')
      .send({ email: 'regular@example.com', password: PASSWORD });

    // Cookie expiry is written to the second, so wait long enough for it to
    // be able to move.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const later = await browser.get('/api/auth/me');

    expect(expiresAt(sessionCookieHeader(later))).toBeGreaterThan(
      expiresAt(sessionCookieHeader(signup)),
    );
  });
});

describe('the session cookie in production', () => {
  const context = useTestApp({
    nodeEnv: 'production',
    clientDistPath: path.join(tmpdir(), 'no-client-build-needed'),
  });

  // Render ends HTTPS at its proxy and forwards plain HTTP, saying so in
  // X-Forwarded-Proto. The app has to trust that to know the request was
  // secure, or it won't set a Secure cookie at all.
  it('is Secure behind the hosting proxy', async () => {
    const response = await request(context.app)
      .post('/api/auth/signup')
      .set('X-Forwarded-Proto', 'https')
      .send({ email: 'secure@example.com', password: PASSWORD });

    expect(sessionCookieHeader(response)).toMatch(/; Secure/);
  });
});
