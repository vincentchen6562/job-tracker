// Values and helpers the HTTP tests share.

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
