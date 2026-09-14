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
});
