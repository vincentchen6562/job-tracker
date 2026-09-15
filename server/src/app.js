import express from 'express';

// Builds the Express app without opening a port, so tests can drive it
// directly. `db` is the Mongoose connection the app's data lives on.
export function createApp(config, db) {
  const app = express();

  // Readable from any origin so the front door page on GitHub Pages can tell
  // when the sleeping server has woken (ADR-0010). It reveals nothing and
  // carries no cookies, so the rest of the API stays same-origin (ADR-0004).
  app.get('/api/health', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.json({ status: 'ok' });
  });

  // In production the built client comes from this same origin (ADR-0004). In
  // development the Vite dev server serves it and forwards /api here.
  if (config.nodeEnv === 'production') {
    app.use(express.static(config.clientDistPath));
  }

  return app;
}
