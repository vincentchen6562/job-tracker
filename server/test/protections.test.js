import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { FIFTEEN_MINUTES_MS, PASSWORD } from './support/http.js';
import { useTestApp } from './support/testApp.js';

const context = useTestApp();

describe('security headers', () => {
  // A sample of what helmet sets, not the full list: enough to show it's on.
  it('are set, and the server stack is not advertised', async () => {
    const response = await request(context.app).get('/api/auth/me');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});

// A page on another site can send a form or a text/plain body without asking,
// but not JSON. Refusing everything else, with SameSite=Lax, is the defence
// against cross-site requests.
describe('a data-changing request that is not JSON', () => {
  it.each([
    ['a form', (req) => req.type('form').send('email=a@example.com&password=0123456789')],
    [
      'JSON-looking text/plain',
      (req) =>
        req
          .set('Content-Type', 'text/plain')
          .send('{"email":"a@example.com","password":"0123456789"}'),
    ],
    ['no body at all', (req) => req],
  ])('is refused with 415 when it sends %s', async (_label, withBody) => {
    const response = await withBody(request(context.app).post('/api/auth/signup'));

    expect(response.status).toBe(415);
  });
});

const GENEROUS = { limit: 1000, windowMs: FIFTEEN_MINUTES_MS };

describe('signing up and logging in', () => {
  const limited = useTestApp({
    rateLimits: { auth: { limit: 2, windowMs: FIFTEEN_MINUTES_MS }, api: GENEROUS },
  });

  // Shared, so guessing passwords can't dodge the limit by switching between
  // the two forms.
  it('share a per-IP limit, answering 429 once it is used up', async () => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await request(limited.app)
        .post('/api/auth/login')
        .send({ email: 'guess@example.com', password: `guess number ${attempt}` });
    }

    const response = await request(limited.app)
      .post('/api/auth/signup')
      .send({ email: 'guess@example.com', password: PASSWORD });

    expect(response.status).toBe(429);
    expect(response.body.error).toEqual(expect.any(String));
  });
});

describe('the general API limit', () => {
  const limited = useTestApp({
    rateLimits: { auth: GENEROUS, api: { limit: 3, windowMs: FIFTEEN_MINUTES_MS } },
  });

  it('answers 429 once it is used up', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(limited.app).get('/api/auth/me');
    }

    const response = await request(limited.app).get('/api/auth/me');

    expect(response.status).toBe(429);
  });

  // The front door polls health while the server wakes; a limit here would
  // leave a visitor stuck on "Waking the server…".
  it('never applies to the health check', async () => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await request(limited.app).get('/api/health');
    }

    const response = await request(limited.app).get('/api/health');

    expect(response.status).toBe(200);
  });
});
