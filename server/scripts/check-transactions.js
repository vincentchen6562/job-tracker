import { existsSync } from 'node:fs';
import { connectDatabase } from '../src/database.js';

// One-off check that transactions work on the database in MONGODB_URI, meant
// for the Atlas development database (issue #7). Restore will replace an
// account's applications inside a transaction, which MongoDB only allows on a
// replica set.
//
// It checks both halves: a committed write is kept, and an aborted one isn't.
// The committed document is left in the transaction-check collection so it can
// be seen in Atlas's Data Explorer.
//
// Run from the repo root: npm run check:transactions --workspace server

const PRODUCTION_DATABASE = 'job-tracker';
// The name MongoDB uses when the connection string doesn't give one.
const DEFAULT_DATABASE = 'test';

class AbortOnPurpose extends Error {}

// Reads server/.env the same way the server does; variables already set in the
// environment win over it.
if (existsSync('.env')) {
  process.loadEnvFile();
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set. Put the development connection string in server/.env.');
  process.exit(1);
}

const db = await connectDatabase(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });

try {
  console.log(`Connected to database "${db.name}" on ${db.host} as ${db.user || '(no user)'}.`);

  if (db.name === PRODUCTION_DATABASE) {
    throw new Error(
      `Refusing to write to "${PRODUCTION_DATABASE}", the production database. ` +
        'Use the development connection string.',
    );
  }
  if (db.name === DEFAULT_DATABASE) {
    throw new Error(
      'The connection string names no database, so MongoDB would use "test". ' +
        'Add the database name after ".mongodb.net/", e.g. /job-tracker-dev?...',
    );
  }

  const collection = db.collection('transaction-check');
  const checkedAt = new Date();

  await db.transaction(async (session) => {
    await collection.insertOne({ outcome: 'committed', checkedAt }, { session });
  });
  if (!(await collection.findOne({ outcome: 'committed', checkedAt }))) {
    throw new Error('A committed transaction did not keep its write.');
  }
  console.log('✓ A committed transaction kept its write.');

  try {
    await db.transaction(async (session) => {
      await collection.insertOne({ outcome: 'aborted', checkedAt }, { session });
      throw new AbortOnPurpose();
    });
  } catch (error) {
    if (!(error instanceof AbortOnPurpose)) throw error;
  }
  if (await collection.findOne({ outcome: 'aborted', checkedAt })) {
    throw new Error('An aborted transaction still kept its write.');
  }
  console.log('✓ An aborted transaction discarded its write.');

  console.log(`Transactions work on "${db.name}".`);
} catch (error) {
  console.error(`Transaction check failed. ${error.message}`);
  process.exitCode = 1;
} finally {
  await db.close();
}
