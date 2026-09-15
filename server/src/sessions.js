import MongoStore from 'connect-mongo';
import session from 'express-session';

export const SESSION_COOKIE = 'connect.sid';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Sessions live in MongoDB and the browser holds only the ID (ADR-0003).
// Stored as objects rather than strings so sessions can be found by account.
export function sessionMiddleware(config, db) {
  return session({
    name: SESSION_COOKIE,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    // Every response pushes the expiry back, so 30 days counts from the last
    // use rather than from logging in.
    rolling: true,
    cookie: {
      httpOnly: true,
      // With the JSON-only rule, this is the defence against cross-site
      // requests (ADR-0004).
      sameSite: 'lax',
      secure: config.nodeEnv === 'production',
      maxAge: THIRTY_DAYS_MS,
    },
    store: MongoStore.create({ client: db.getClient(), dbName: db.name, stringify: false }),
  });
}
