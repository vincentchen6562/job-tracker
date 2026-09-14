import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, inject } from 'vitest';
import { connectDatabase } from '../../src/database.js';
import { createApp } from '../../src/app.js';

const testConfig = {
  mongodbUri: 'unused: tests are handed a connection',
  sessionSecret: 'test-session-secret',
  nodeEnv: 'test',
  port: 0,
};

// Gives the calling test file its own empty database, dropped once the file
// finishes, and an app built on it. Call it at the top level of a test file.
//
// Returns an object whose `app` and `db` are filled in before the tests run.
export function useTestApp(configOverrides = {}) {
  const context = { app: undefined, db: undefined };

  beforeAll(async () => {
    context.db = await connectDatabase(inject('mongoUri'), {
      dbName: `test-${randomUUID()}`,
    });
    context.app = createApp({ ...testConfig, ...configOverrides }, context.db);
  });

  afterAll(async () => {
    await context.db?.dropDatabase();
    await context.db?.close();
  });

  return context;
}
