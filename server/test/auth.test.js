import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { PASSWORD, sessionCookie } from './support/http.js';
import { useTestApp } from './support/testApp.js';

const context = useTestApp();

describe('signing up', () => {
  it('creates an account that is logged in straight away', async () => {
    const browser = request.agent(context.app);

    const signup = await browser
      .post('/api/auth/signup')
      .send({ email: 'new@example.com', password: PASSWORD });
    expect(signup.status).toBe(201);

    const me = await browser.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ email: 'new@example.com', isDemo: false });
    expect(me.body.id).toEqual(expect.any(String));
  });

  it('refuses an email that already has an account, however it is typed', async () => {
    await request(context.app)
      .post('/api/auth/signup')
      .send({ email: 'taken@example.com', password: PASSWORD });

    const response = await request(context.app)
      .post('/api/auth/signup')
      .send({ email: '  Taken@Example.COM ', password: PASSWORD });

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/already has an account/i);
  });

  // Length is the only rule: no required digits or symbols.
  it.each([
    ['9 characters', 400, 'a'.repeat(9)],
    ['129 characters', 400, 'a'.repeat(129)],
    ['10 characters', 201, 'a'.repeat(10)],
    ['128 characters', 201, 'a'.repeat(128)],
  ])('answers a password of %s with %i', async (_label, status, password) => {
    const response = await request(context.app)
      .post('/api/auth/signup')
      .send({ email: `length-${password.length}@example.com`, password });

    expect(response.status).toBe(status);
  });

  it.each([
    ['no email', {}],
    ['an email with no @', { email: 'not-an-email' }],
    ['an email that is not text', { email: { $gt: '' } }],
  ])('answers %s with 400', async (_label, fields) => {
    const response = await request(context.app)
      .post('/api/auth/signup')
      .send({ ...fields, password: PASSWORD });

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual(expect.any(String));
  });
});

describe('the password', () => {
  it('is never sent back, from sign-up, login or the current account', async () => {
    const browser = request.agent(context.app);
    const credentials = { email: 'hidden@example.com', password: PASSWORD };

    const responses = [
      await browser.post('/api/auth/signup').send(credentials),
      await browser.post('/api/auth/login').send(credentials),
      await browser.get('/api/auth/me'),
    ];

    for (const response of responses) {
      expect(response.status).toBeLessThan(300);
      expect(JSON.stringify(response.body)).not.toMatch(/password|\$2[aby]\$/i);
    }
  });
});

describe('logging in', () => {
  it('logs in to an existing account with its email and password', async () => {
    await request(context.app)
      .post('/api/auth/signup')
      .send({ email: 'returning@example.com', password: PASSWORD });
    const browser = request.agent(context.app);

    const login = await browser
      .post('/api/auth/login')
      .send({ email: ' Returning@Example.com', password: PASSWORD });
    expect(login.status).toBe(200);

    const me = await browser.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('returning@example.com');
  });

  // The same answer either way, so the login form can't be used to find out
  // which emails have accounts.
  it('gives a wrong email and a wrong password the same 401', async () => {
    await request(context.app)
      .post('/api/auth/signup')
      .send({ email: 'private@example.com', password: PASSWORD });

    const wrongEmail = await request(context.app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: PASSWORD });
    const wrongPassword = await request(context.app)
      .post('/api/auth/login')
      .send({ email: 'private@example.com', password: 'not the password' });

    expect(wrongEmail.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(wrongEmail.body).toEqual(wrongPassword.body);
  });

  it('gives the browser a new session ID', async () => {
    const browser = request.agent(context.app);
    const signup = await browser
      .post('/api/auth/signup')
      .send({ email: 'rotated@example.com', password: PASSWORD });

    const login = await browser
      .post('/api/auth/login')
      .send({ email: 'rotated@example.com', password: PASSWORD });

    expect(sessionCookie(login)).toBeDefined();
    expect(sessionCookie(login)).not.toBe(sessionCookie(signup));
  });
});

describe('logging out', () => {
  // Sends the old cookie by hand rather than through an agent, which would
  // drop it if told to: the session has to end on the server, not just in
  // the browser.
  it('ends the session, so the old cookie is no longer logged in', async () => {
    const signup = await request(context.app)
      .post('/api/auth/signup')
      .send({ email: 'leaving@example.com', password: PASSWORD });
    const cookie = sessionCookie(signup);

    const logout = await request(context.app)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .send({});
    expect(logout.status).toBe(204);

    const me = await request(context.app).get('/api/auth/me').set('Cookie', cookie);
    expect(me.status).toBe(401);
  });
});
