import { execFile } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, describe, expect, it } from 'vitest';

const entryPoint = fileURLToPath(new URL('../src/index.js', import.meta.url));

// The entry point reads .env from its working directory, so it runs from an
// empty one: a developer's own server/.env mustn't fill in what's missing.
const emptyDir = mkdtempSync(path.join(tmpdir(), 'server-startup-'));
afterAll(() => rmSync(emptyDir, { recursive: true, force: true }));

// Starts the real entry point with only the given environment variables, and
// resolves with how the process ended.
async function startServer(env) {
  try {
    const { stdout, stderr } = await promisify(execFile)(process.execPath, [entryPoint], {
      cwd: emptyDir,
      env,
      timeout: 10_000,
    });
    return { exitCode: 0, stdout, stderr };
  } catch (error) {
    return { exitCode: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

describe('starting the server', () => {
  it('fails, naming both, when MONGODB_URI and SESSION_SECRET are missing', async () => {
    const result = await startServer({});

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('MONGODB_URI');
    expect(result.stderr).toContain('SESSION_SECRET');
  });

  it('fails when only SESSION_SECRET is missing', async () => {
    const result = await startServer({ MONGODB_URI: 'mongodb://127.0.0.1:1/unused' });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('SESSION_SECRET');
    expect(result.stderr).not.toContain('MONGODB_URI');
  });

  it('fails when only MONGODB_URI is missing', async () => {
    const result = await startServer({ SESSION_SECRET: 'a-secret' });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('MONGODB_URI');
    expect(result.stderr).not.toContain('SESSION_SECRET');
  });

  // Rate limits are optional, but a typo in one mustn't quietly break it.
  it('fails, naming it, when a rate limit setting is not a positive number', async () => {
    const result = await startServer({
      MONGODB_URI: 'mongodb://127.0.0.1:1/unused',
      SESSION_SECRET: 'a-secret',
      RATE_LIMIT_AUTH_MAX: 'ten',
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('RATE_LIMIT_AUTH_MAX');
  });
});
