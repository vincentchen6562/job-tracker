import { fileURLToPath } from 'node:url';

const REQUIRED = ['MONGODB_URI', 'SESSION_SECRET'];

const DEFAULT_PORT = 3000;
const DEFAULT_CLIENT_DIST_PATH = fileURLToPath(new URL('../../client/dist', import.meta.url));

export class ConfigError extends Error {
  name = 'ConfigError';
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
  };
}
