import express from 'express';
import helmet from 'helmet';
import { createApplicationsRouter } from './applications.js';
import { createAuthRouter } from './auth.js';
import { handleErrors } from './errors.js';
import { createRateLimiter, requireJson } from './protections.js';
import { createRestoreRouter } from './restore.js';
import { sessionMiddleware } from './sessions.js';

// Builds the Express app without opening a port, so tests can drive it
// directly. `db` is the Mongoose connection the app's data lives on.
export function createApp(config, db) {
  const app = express();

  // Render ends HTTPS at one proxy in front of the app. Trusting that hop
  // lets the app see the real protocol and client IP, which Secure cookies
  // and per-IP rate limits depend on.
  app.set('trust proxy', 1);

  // First, so every response gets the security headers, the built client
  // included. Its defaults already allow Google Fonts, the only outside
  // resource the client loads.
  app.use(helmet());

  // Readable from any origin so the front door page on GitHub Pages can tell
  // when the sleeping server has woken (ADR-0010). It reveals nothing and
  // carries no cookies, so the rest of the API stays same-origin (ADR-0004).
  // Registered before the API limit: the front door polls this while the
  // server wakes, and a limit would leave a visitor stuck waiting.
  app.get('/api/health', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.json({ status: 'ok' });
  });

  // Before the JSON check and the body parser, so a flood is turned away as
  // cheaply as possible.
  app.use('/api', createRateLimiter(config.rateLimits.api));
  app.use(requireJson);
  app.use(sessionMiddleware(config, db));

  // Before the body parser: a backup is read with a larger limit of its own.
  app.use('/api/restore', createRestoreRouter(db));

  app.use(express.json());

  app.use('/api/auth', createAuthRouter(config, db));
  app.use('/api/applications', createApplicationsRouter(db));

  // In production the built client comes from this same origin (ADR-0004). In
  // development the Vite dev server serves it and forwards /api here.
  if (config.nodeEnv === 'production') {
    app.use(express.static(config.clientDistPath));
  }

  // Last, so it catches errors from every route above.
  app.use(handleErrors);

  return app;
}
