import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    // Absent for demo accounts, which have no password.
    passwordHash: { type: String },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Models belong to a connection, and each test file brings its own, so the
// model is looked up on the connection it's asked for rather than made once.
export function accountModel(db) {
  return db.models.Account ?? db.model('Account', accountSchema);
}

// The account as the browser sees it. Never includes the password hash.
export function publicAccount(account) {
  return { id: account._id.toString(), email: account.email, isDemo: account.isDemo };
}
