import { DEMO_LIFETIME_MS } from '@job-tracker/shared';
import express from 'express';
import { accountModel } from './accounts.js';
import { applicationModel, publicApplication } from './applications.js';
import { seedApplications } from './seedData.js';
import { requireLogin } from './sessions.js';

// The seed data as fresh applications for one account. They take the
// account's own expiry, so a demo's applications never outlive it (ADR-0005).
function seedFor(accountId, expiresAt) {
  return seedApplications.map((application) => ({ ...application, accountId, expiresAt }));
}

// A demo account is made for one visitor who wants to try the tracker, with
// no sign-up: no email and no password to log back in with (ADR-0005). It
// starts with the seed data.
export async function createDemoAccount(db) {
  // One instant for the account and its applications, so the two expire
  // together rather than leaving applications behind for a deleted account.
  const expiresAt = new Date(Date.now() + DEMO_LIFETIME_MS);
  return db.transaction(async (session) => {
    const [account] = await accountModel(db).create([{ isDemo: true, expiresAt }], { session });
    await applicationModel(db).insertMany(seedFor(account._id, expiresAt), { session });
    return account;
  });
}

// Refuses a request whose account isn't the kind the route is for. The
// account itself is asked rather than the session, so the answer comes from
// the one place that decides what a demo account is, and it is handed on for
// routes that need what it carries.
function requireAccountKind(db, { demo, error }) {
  return async (req, res, next) => {
    const account = await accountModel(db).findById(req.session.accountId);
    if (Boolean(account?.isDemo) !== demo) return res.status(403).json({ error });
    req.account = account;
    next();
  };
}

// The account settings a demo has no use for: it has no password to change,
// and it deletes itself when it expires.
export function requireRealAccount(db) {
  return requireAccountKind(db, {
    demo: false,
    error: "A demo account doesn't have these settings. Sign up for a real account instead.",
  });
}

// The other way round: only a demo has seed data to go back to.
function requireDemoAccount(db) {
  return requireAccountKind(db, {
    demo: true,
    error: 'Only a demo account can be reset to the seed data.',
  });
}

// Puts the demo back to the applications it started with, all in one
// transaction so a visitor is never left with half a tracker. The fresh
// applications take the demo's own expiry, so they go when it does.
function resetToSeed(db, account) {
  const Application = applicationModel(db);
  return db.transaction(async (session) => {
    await Application.deleteMany({ accountId: account._id }, { session });
    return Application.insertMany(seedFor(account._id, account.expiresAt), { session });
  });
}

// A router of its own rather than a route on the applications router, which
// would import this module while this one imports it. Restoring a backup,
// which also replaces every application, is mounted the same way.
export function createDemoRouter(db) {
  const router = express.Router();

  // Before the demo check, so a logged-out request is answered 401 rather
  // than told it isn't a demo.
  router.use(requireLogin);

  router.post('/', requireDemoAccount(db), async (req, res) => {
    const applications = await resetToSeed(db, req.account);
    res.json(applications.map(publicApplication));
  });

  // The applications router owns the rest of that path, so without this a PUT
  // here would fall through to it and be taken for an application whose id is
  // "reset-to-seed".
  router.all('/', (req, res) => {
    res.status(405).set('Allow', 'POST').json({ error: 'Use POST to reset to the seed data.' });
  });

  return router;
}
