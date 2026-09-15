// Values and helpers the HTTP tests share.

import request from 'supertest';

// Long enough for the password length rule.
export const PASSWORD = 'correct horse battery';

export const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

// The full Set-Cookie line for the session cookie a response set, if any.
export function sessionCookieHeader(response) {
  return response.headers['set-cookie']?.find((cookie) => cookie.startsWith('connect.sid='));
}

// Just its `name=value`, which is what a browser sends back.
export function sessionCookie(response) {
  return sessionCookieHeader(response)?.split(';')[0];
}

// A browser that has just signed up, so its requests are logged in to a new
// account.
export async function signedUpBrowser(app, email) {
  const browser = request.agent(app);
  const response = await browser.post('/api/auth/signup').send({ email, password: PASSWORD });
  if (response.status !== 201) {
    throw new Error(`Signing up ${email} failed with ${response.status}.`);
  }
  return browser;
}

// Another browser logged in to an account that already exists, like a second
// device.
export async function loggedInBrowser(app, email) {
  const browser = request.agent(app);
  const response = await browser.post('/api/auth/login').send({ email, password: PASSWORD });
  if (response.status !== 200) {
    throw new Error(`Logging in ${email} failed with ${response.status}.`);
  }
  return browser;
}
