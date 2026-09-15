import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { accountModel, normalizeEmail, setPassword } from '../src/accounts.js';
import { connectDatabase } from '../src/database.js';

// Resets the password of someone locked out of their account, since there is
// no forgot-password flow yet (ADR-0002). It gives the account a random new
// password, logs it out everywhere, and prints the password to pass on. They
// can change it on the account page once they've logged in.
//
// It acts on the database in MONGODB_URI, so it resets a production account
// when given production's connection string.
//
// Run from the repo root: npm run reset-password --workspace server -- someone@example.com

// Reads .env from the directory it runs in, which is server/ through the npm
// command, the same way the server does. Variables already set in the
// environment win over it.
if (existsSync('.env')) {
  process.loadEnvFile();
}

const email = normalizeEmail(process.argv[2]);
if (!email) {
  console.error(
    'Give the email of the account to reset: ' +
      'npm run reset-password --workspace server -- someone@example.com',
  );
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set. Put the connection string in server/.env.');
  process.exit(1);
}

const db = await connectDatabase(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });

try {
  const account = await accountModel(db).findOne({ email });
  if (!account) {
    throw new Error(`No account on database "${db.name}" has the email ${email}.`);
  }

  // 18 random bytes are 24 characters, well inside the password length rule.
  const password = randomBytes(18).toString('base64url');
  await setPassword(db, account._id.toString(), password);

  console.log(`Reset the password for ${email} on database "${db.name}", and logged it out everywhere.`);
  console.log(`New password: ${password}`);
} catch (error) {
  console.error(`Password not reset. ${error.message}`);
  process.exitCode = 1;
} finally {
  await db.close();
}
