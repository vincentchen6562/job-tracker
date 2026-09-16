import bcrypt from 'bcrypt';
import express from 'express';
import { PASSWORD_MAX, PASSWORD_MIN } from '@job-tracker/shared';
import {
  BCRYPT_COST,
  accountModel,
  deleteAccount,
  normalizeEmail,
  publicAccount,
  setPassword,
} from './accounts.js';
import { createDemoAccount, requireRealAccount } from './demo.js';
import { createRateLimiter } from './protections.js';
import { SESSION_COOKIE, demoHasExpired, requireLogin } from './sessions.js';

// Compared against when there's no password to check, such as for an email no
// account has, at the same cost as a real hash, so every failure takes as long.
const DECOY_HASH = bcrypt.hashSync('no account has this email', BCRYPT_COST);

// MongoDB's error code when a write breaks a unique index.
const DUPLICATE_KEY = 11000;

const PASSWORD_RULE = `Password must be ${PASSWORD_MIN}–${PASSWORD_MAX} characters.`;

function isAllowedPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= PASSWORD_MIN &&
    password.length <= PASSWORD_MAX
  );
}

// Whether the password is the account's. A missing account, or one without a
// password, is still compared against a decoy, so response time doesn't reveal
// which emails have accounts.
function passwordMatches(account, password) {
  return bcrypt.compare(
    typeof password === 'string' ? password : '',
    account?.passwordHash ?? DECOY_HASH,
  );
}

// Swaps the session for a new one holding the account, so a session ID from
// before logging in can't be used to ride the logged-in session.
function startSession(req, account) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      req.session.accountId = account._id.toString();
      // Carried so the applications saved during the session can be given the
      // same expiry as the demo they're added to (ADR-0005).
      if (account.isDemo) {
        req.session.demoExpiresAt = account.expiresAt.toISOString();
        // The cookie ends with the demo rather than lasting the usual thirty
        // days, which would leave a visitor logged in to a deleted account.
        // Later requests are re-pinned by the session middleware.
        const remaining = account.expiresAt.getTime() - Date.now();
        req.session.cookie.originalMaxAge = remaining;
        req.session.cookie.maxAge = remaining;
      }
      resolve();
    });
  });
}

// Deletes the request's session from the store, and the session middleware
// then has nothing to save back.
function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}

export function createAuthRouter(config, db) {
  const Account = accountModel(db);
  const router = express.Router();
  // One limiter on every route that checks a password, so guesses can't dodge
  // it by switching between them.
  const authLimit = createRateLimiter(config.rateLimits.auth);
  // Its own, much smaller allowance: making a demo takes no password, so the
  // auth limit protecting password guesses is the wrong shape for it.
  const demoLimit = createRateLimiter(config.rateLimits.demo);
  const realAccount = requireRealAccount(db);

  router.post('/signup', authLimit, async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (!isAllowedPassword(password)) {
      return res.status(400).json({ error: PASSWORD_RULE });
    }

    let account;
    try {
      account = await Account.create({
        email,
        passwordHash: await bcrypt.hash(password, BCRYPT_COST),
      });
    } catch (error) {
      if (error.code !== DUPLICATE_KEY) throw error;
      return res
        .status(409)
        .json({ error: 'That email already has an account. Log in instead.' });
    }

    await startSession(req, account);
    res.status(201).json(publicAccount(account));
  });

  // No email and no password: the visitor is given an account of their own,
  // holding the seed data, and logged straight in to it (ADR-0005).
  router.post('/demo', demoLimit, async (req, res) => {
    const account = await createDemoAccount(db);
    await startSession(req, account);
    res.status(201).json(publicAccount(account));
  });

  router.post('/login', authLimit, async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    const account = email && (await Account.findOne({ email }));
    const matches = await passwordMatches(account, password);
    if (!account || !matches) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    await startSession(req, account);
    res.json(publicAccount(account));
  });

  // Deletes the session from the store, not just the cookie, so a copied
  // cookie stops working too.
  router.post('/logout', async (req, res) => {
    await destroySession(req);
    res.clearCookie(SESSION_COOKIE).status(204).end();
  });

  router.put('/password', authLimit, requireLogin, realAccount, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!isAllowedPassword(newPassword)) {
      return res.status(400).json({ error: PASSWORD_RULE });
    }
    const account = await Account.findById(req.session.accountId);
    if (!(await passwordMatches(account, currentPassword))) {
      return res.status(403).json({ error: 'Current password is incorrect.' });
    }
    await setPassword(db, req.session.accountId, newPassword, { keepSessionId: req.sessionID });
    res.status(204).end();
  });

  // Asks for the password again, so a browser left logged in can't be used to
  // delete the account.
  router.delete('/account', authLimit, requireLogin, realAccount, async (req, res) => {
    const { accountId } = req.session;
    if (!(await passwordMatches(await Account.findById(accountId), req.body.password))) {
      return res.status(403).json({ error: 'Password is incorrect.' });
    }
    await deleteAccount(db, accountId);
    // Destroyed as well, or the session middleware would save this request's
    // session straight back into the store.
    await destroySession(req);
    res.clearCookie(SESSION_COOKIE).status(204).end();
  });

  router.get('/me', async (req, res) => {
    const account =
      req.session.accountId &&
      !demoHasExpired(req) &&
      (await Account.findById(req.session.accountId));
    if (!account) return res.status(401).json({ error: 'Not logged in.' });
    res.json(publicAccount(account));
  });

  return router;
}
