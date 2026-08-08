import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { env } from './src/config/env.js';
import { schedulePaydayJob } from './src/jobs/paydayJob.js';

async function start() {
  await connectDB();
  schedulePaydayJob();
  app.listen(env.port, () => {
    console.log(`18 Before 18 API listening on port ${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
