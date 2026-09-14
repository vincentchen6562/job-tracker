import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { useTestApp } from './support/testApp.js';

// A stand-in for the client build, so these tests don't depend on running it.
const clientDistPath = mkdtempSync(path.join(tmpdir(), 'client-dist-'));
writeFileSync(path.join(clientDistPath, 'index.html'), '<!doctype html><title>Tracker</title>');
afterAll(() => rmSync(clientDistPath, { recursive: true, force: true }));

describe('in production', () => {
  const context = useTestApp({ nodeEnv: 'production', clientDistPath });

  it('serves the built client at /', async () => {
    const response = await request(context.app).get('/');

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
    expect(response.text).toContain('<title>Tracker</title>');
  });

  it('serves the API from the same origin', async () => {
    const response = await request(context.app).get('/api/health');

    expect(response.status).toBe(200);
  });
});

describe('in development', () => {
  const context = useTestApp({ nodeEnv: 'development', clientDistPath });

  it('leaves the client to the Vite dev server', async () => {
    const response = await request(context.app).get('/');

    expect(response.status).toBe(404);
  });
});
