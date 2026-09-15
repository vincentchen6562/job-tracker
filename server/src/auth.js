import bcrypt from 'bcrypt';
import express from 'express';
import { ACCOUNT_HEADER, PASSWORD_MAX, PASSWORD_MIN } from '@job-tracker/shared';
import { accountModel, publicAccount } from './accounts.js';
import { createRateLimiter } from './protections.js';
import { SESSION_COOKIE } from './sessions.js';

const BCRYPT_COST = 12;

// Compared against when no account has the email, at the same cost as a real
// hash, so both failures take as long.
const DECOY_HASH = bcrypt.hashSync('no account has this email', BCRYPT_COST);

// MongoDB's error code when a write breaks a unique index.
const DUPLICATE_KEY = 11000;

// The email as it's stored: trimmed and lowercased, so "Me@Example.com " and
// "me@example.com" are one account. Null for anything that isn't text shaped
// like an email, which also stops query operators like { $gt: '' }.
function normalizeEmail(email) {
  if (typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+$/.test(normalized) ? normalized : null;
}

function isAllowedPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= PASSWORD_MIN &&
    password.length <= PASSWORD_MAX
  );
}

// Swaps the session for a new one holding the account, so a session ID from
// before logging in can't be used to ride the logged-in session.
function startSession(req, account) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      req.session.accountId = account._id.toString();
      resolve();
    });
  });
}

// Guards routes that act on an account's data. Account deletion ends every
// session, so a session holding an account ID is enough to go on. A request
// naming another account comes from a page showing that one, after another
// tab logged in to this one, so acting on it would put its edits in the wrong
// account.
export function requireLogin(req, res, next) {
  if (!req.session.accountId) return res.status(401).json({ error: 'Not logged in.' });
  const named = req.get(ACCOUNT_HEADER);
  if (named && named !== req.session.accountId) {
    return res.status(401).json({ error: 'Logged in as a different account.' });
  }
  next();
}

export function createAuthRouter(config, db) {
  const Account = accountModel(db);
  const router = express.Router();
  // One limiter on both forms, so guesses can't dodge it by switching between
  // them.
  const authLimit = createRateLimiter(config.rateLimits.auth);

  router.post('/signup', authLimit, async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (!isAllowedPassword(password)) {
      return res.status(400).json({
        error: `Password must be ${PASSWORD_MIN}–${PASSWORD_MAX} characters.`,
      });
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

  router.post('/login', authLimit, async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    const account = email && (await Account.findOne({ email }));

    // A missing account still pays for a hash comparison, so response time
    // doesn't reveal which emails have accounts.
    const matches = await bcrypt.compare(
      typeof password === 'string' ? password : '',
      account?.passwordHash ?? DECOY_HASH,
    );
    if (!account || !matches) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    await startSession(req, account);
    res.json(publicAccount(account));
  });

  // Deletes the session from the store, not just the cookie, so a copied
  // cookie stops working too.
  router.post('/logout', async (req, res) => {
    await new Promise((resolve, reject) => {
      req.session.destroy((error) => (error ? reject(error) : resolve()));
    });
    res.clearCookie(SESSION_COOKIE).status(204).end();
  });

  router.get('/me', async (req, res) => {
    const account = req.session.accountId && (await Account.findById(req.session.accountId));
    if (!account) return res.status(401).json({ error: 'Not logged in.' });
    res.json(publicAccount(account));
  });

  return router;
}
