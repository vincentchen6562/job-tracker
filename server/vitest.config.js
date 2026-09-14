import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
    globalSetup: ['test/support/globalSetup.js'],
    // Starting the in-memory replica set can be slow on a cold cache, when
    // its MongoDB binary is still downloading.
    hookTimeout: 60_000,
  },
});
