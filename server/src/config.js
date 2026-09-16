import { fileURLToPath } from 'node:url';

const REQUIRED = ['MONGODB_URI', 'SESSION_SECRET'];

const DEFAULT_PORT = 3000;
const DEFAULT_CLIENT_DIST_PATH = fileURLToPath(new URL('../../client/dist', import.meta.url));

const MINUTE_MS = 60 * 1000;

export class ConfigError extends Error {
  name = 'ConfigError';
}

// An optional setting that has to be a positive number when it's given.
function readPositiveNumber(env, name, fallback) {
  if (!env[name]) return fallback;
  const value = Number(env[name]);
  if (!Number.isFinite(value) || value <= 0) {
    throw new ConfigError(`${name} must be a positive number, not "${env[name]}".`);
  }
  return value;
}

// Reads the server's settings from environment variables, refusing to go on
// when a required one is missing so a bad deploy fails loudly.
export function loadConfig(env = process.env) {
  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new ConfigError(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Set them in the environment, or copy server/.env.example to server/.env and fill it in.',
    );
  }

  return {
    mongodbUri: env.MONGODB_URI,
    sessionSecret: env.SESSION_SECRET,
    nodeEnv: env.NODE_ENV || 'development',
    port: env.PORT ? Number(env.PORT) : DEFAULT_PORT,
    clientDistPath: DEFAULT_CLIENT_DIST_PATH,
    // Per IP. Sign-up and login share the auth allowance; the API one covers
    // every API request and has to leave room for autosave. The demo one is
    // its own, and much smaller: a demo takes no password to make and arrives
    // holding a set of seed applications.
    rateLimits: {
      auth: {
        limit: readPositiveNumber(env, 'RATE_LIMIT_AUTH_MAX', 10),
        windowMs: readPositiveNumber(env, 'RATE_LIMIT_AUTH_WINDOW_MINUTES', 15) * MINUTE_MS,
      },
      demo: {
        limit: readPositiveNumber(env, 'RATE_LIMIT_DEMO_MAX', 5),
        windowMs: readPositiveNumber(env, 'RATE_LIMIT_DEMO_WINDOW_MINUTES', 60) * MINUTE_MS,
      },
      api: {
        limit: readPositiveNumber(env, 'RATE_LIMIT_API_MAX', 1000),
        windowMs: readPositiveNumber(env, 'RATE_LIMIT_API_WINDOW_MINUTES', 15) * MINUTE_MS,
      },
    },
  };
}
