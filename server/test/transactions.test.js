import { describe, expect, it } from 'vitest';
import { useTestApp } from './support/testApp.js';

const context = useTestApp();

// Restore replaces an account's applications inside a transaction, which
// MongoDB only allows on a replica set. This proves the test database is one.
// Reaching into the database is the exception to testing through HTTP, until
// an endpoint that uses a transaction exists.
describe('the test database', () => {
  it('commits a transaction', async () => {
    const collection = context.db.collection('transaction-check');

    await context.db.transaction(async (session) => {
      await collection.insertOne({ name: 'committed' }, { session });
    });

    expect(await collection.findOne({ name: 'committed' })).not.toBeNull();
  });
});
