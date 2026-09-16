import { ACCOUNT_HEADER } from '@job-tracker/shared';
import MongoStore from 'connect-mongo';
import session from 'express-session';

export const SESSION_COOKIE = 'connect.sid';

const SESSIONS_COLLECTION = 'sessions';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Deletes every stored session logged in to the account, apart from the one
// with the ID `except`, so their cookies stop working. Pass `session` to do it
// inside a transaction.
export function endSessions(db, accountId, { except, session } = {}) {
  const filter = { 'session.accountId': accountId };
  if (except) filter._id = { $ne: except };
  return db.collection(SESSIONS_COLLECTION).deleteMany(filter, { session });
}

// The expiry anything saved in this request should take, or undefined for a
// real account, whose applications never expire. A demo's session carries it
// (ADR-0005), so an autosave doesn't have to look the account up to find it.
// A demo account's expiry never changes, so the copy can't drift.
export function demoExpiry(req) {
  return req.session.demoExpiresAt ? new Date(req.session.demoExpiresAt) : undefined;
}

// Whether this request's demo has run out. A TTL index deletes the account
// itself, but MongoDB clears expired documents on its own schedule, so the
// session stops working on the expiry rather than waiting to be swept up.
export function demoHasExpired(req) {
  const expiry = demoExpiry(req);
  return expiry !== undefined && expiry.getTime() <= Date.now();
}

// Guards routes that act on an account's data. Account deletion ends every
// session, so a session holding an account ID is enough to go on. A request
// naming another account comes from a page showing that one, after another
// tab logged in to this one, so acting on it would put its edits in the wrong
// account.
export function requireLogin(req, res, next) {
  if (!req.session.accountId) return res.status(401).json({ error: 'Not logged in.' });
  if (demoHasExpired(req)) {
    return res.status(401).json({ error: 'This demo has ended. Start another to keep looking.' });
  }
  const named = req.get(ACCOUNT_HEADER);
  if (named && named !== req.session.accountId) {
    return res.status(401).json({ error: 'Logged in as a different account.' });
  }
  next();
}

// Keeps a demo's cookie ending when the demo does. `rolling` re-stamps every
// response's cookie as now plus `originalMaxAge`, so that is re-pointed at
// the demo's own expiry on each request; otherwise a long visit would slide
// the cookie, and the stored session with it, past the account it belongs to.
function pinDemoCookie(req, res, next) {
  const expiry = demoExpiry(req);
  if (expiry) req.session.cookie.originalMaxAge = expiry.getTime() - Date.now();
  next();
}

// Sessions live in MongoDB and the browser holds only the ID (ADR-0003).
// Stored as objects rather than strings so sessions can be found by account.
export function sessionMiddleware(config, db) {
  return [
    session({
      name: SESSION_COOKIE,
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      // Every response pushes the expiry back, so 30 days counts from the
      // last use rather than from logging in.
      rolling: true,
      cookie: {
        httpOnly: true,
        // With the JSON-only rule, this is the defence against cross-site
        // requests (ADR-0004).
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        maxAge: THIRTY_DAYS_MS,
      },
      store: MongoStore.create({
        client: db.getClient(),
        dbName: db.name,
        collectionName: SESSIONS_COLLECTION,
        stringify: false,
      }),
    }),
    pinDemoCookie,
  ];
}
