import { existsSync } from 'node:fs';
import { createApp } from './app.js';
import { ConfigError, loadConfig } from './config.js';
import { connectDatabase } from './database.js';

// Local settings live in a .env file in the working directory (server/, when
// run through npm). Variables already set in the environment win over it. This
// is done here rather than with node's --env-file-if-exists, because --watch
// crashes trying to watch that file when it doesn't exist.
if (existsSync('.env')) {
  process.loadEnvFile();
}

let config;
try {
  config = loadConfig();
} catch (error) {
  if (!(error instanceof ConfigError)) throw error;
  console.error(`Server not started. ${error.message}`);
  process.exit(1);
}

const db = await connectDatabase(config.mongodbUri);
const app = createApp(config, db);

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port} (${config.nodeEnv})`);
});
