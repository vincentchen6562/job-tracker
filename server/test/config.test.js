import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

// Enough to get past the required settings; the limits are what's under test.
const REQUIRED = { MONGODB_URI: 'mongodb://127.0.0.1:1/unused', SESSION_SECRET: 'a-secret' };

const AN_HOUR_MS = 60 * 60 * 1000;

// The limits a deployment gets when it sets nothing, which is what production
// actually runs on. The tests of the limiting itself pass their own small
// numbers, so without this the shipped defaults would go unchecked.
describe('the demo rate limit', () => {
  it('allows five demo accounts an hour from one IP by default (ADR-0005)', () => {
    const config = loadConfig(REQUIRED);

    expect(config.rateLimits.demo).toEqual({ limit: 5, windowMs: AN_HOUR_MS });
  });

  it('takes its own settings from the environment', () => {
    const config = loadConfig({
      ...REQUIRED,
      RATE_LIMIT_DEMO_MAX: '2',
      RATE_LIMIT_DEMO_WINDOW_MINUTES: '5',
    });

    expect(config.rateLimits.demo).toEqual({ limit: 2, windowMs: 5 * 60 * 1000 });
  });
});
