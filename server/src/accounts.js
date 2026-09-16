import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { applicationModel } from './applications.js';
import { endSessions } from './sessions.js';

export const BCRYPT_COST = 12;

const accountSchema = new mongoose.Schema(
  {
    // Absent for demo accounts, which are made without one. Unique among the
    // accounts that have one, so the index is sparse: every demo would
    // otherwise index as the same null and only the first could be created.
    email: {
      type: String,
      required: [
        function emailUnlessDemo() {
          return !this.isDemo;
        },
        'Email is required.',
      ],
      trim: true,
      lowercase: true,
      index: { unique: true, sparse: true },
    },
    // Absent for demo accounts, which have no password.
    passwordHash: { type: String },
    isDemo: { type: Boolean, default: false },
    // Set only on demo accounts, which are deleted once it passes (ADR-0005).
    // Absent on real accounts, so nothing ever expires them.
    expiresAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Deletes a demo account as soon as its expiry passes, with no scheduled job
// of our own to run (ADR-0005). Documents without the field are left alone,
// which is every real account.
accountSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Models belong to a connection, and each test file brings its own, so the
// model is looked up on the connection it's asked for rather than made once.
export function accountModel(db) {
  return db.models.Account ?? db.model('Account', accountSchema);
}

// The account as the browser sees it. Never includes the password hash.
export function publicAccount(account) {
  return { id: account._id.toString(), email: account.email, isDemo: account.isDemo };
}

// The email as it's stored: trimmed and lowercased, so "Me@Example.com " and
// "me@example.com" are one account. Null for anything that isn't text shaped
// like an email, which also stops query operators like { $gt: '' }.
export function normalizeEmail(email) {
  if (typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+$/.test(normalized) ? normalized : null;
}

// Gives the account a new password and ends its sessions together, so a
// copied cookie can't outlive the old password. The session with the ID
// `keepSessionId`, when given, stays logged in.
export async function setPassword(db, accountId, password, { keepSessionId } = {}) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  await db.transaction(async (session) => {
    await accountModel(db).updateOne({ _id: accountId }, { passwordHash }, { session });
    await endSessions(db, accountId, { except: keepSessionId, session });
  });
}

// Deletes the account, its applications and every session logged in to it,
// all or nothing, so no session outlives the account it's for.
export async function deleteAccount(db, accountId) {
  await db.transaction(async (session) => {
    await applicationModel(db).deleteMany({ accountId }, { session });
    await accountModel(db).deleteOne({ _id: accountId }, { session });
    await endSessions(db, accountId, { session });
  });
}
