import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { useTestApp } from './support/testApp.js';

const context = useTestApp();

describe('GET /api/health', () => {
  it('responds 200 without being logged in', async () => {
    const response = await request(context.app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  // The front door page on GitHub Pages polls this from another origin to
  // tell when the sleeping server has woken (ADR-0010).
  it('can be read from any origin', async () => {
    const response = await request(context.app)
      .get('/api/health')
      .set('Origin', 'https://vincentchen6562.github.io');

    expect(response.headers['access-control-allow-origin']).toBe('*');
  });
});
