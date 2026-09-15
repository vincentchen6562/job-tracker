import { execFile } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, describe, expect, inject, it } from 'vitest';
import { PASSWORD, logIn, signedUpBrowser } from './support/http.js';
import { useTestApp } from './support/testApp.js';

const script = fileURLToPath(new URL('../scripts/reset-password.js', import.meta.url));

// The script reads .env from its working directory, so it runs from an empty
// one: a developer's own server/.env mustn't point it at their database.
const emptyDir = mkdtempSync(path.join(tmpdir(), 'reset-password-'));
afterAll(() => rmSync(emptyDir, { recursive: true, force: true }));

const context = useTestApp();

// Runs the real script against this file's database, and resolves with how
// the process ended.
async function resetPassword(...args) {
  const uri = new URL(inject('mongoUri'));
  uri.pathname = `/${context.db.name}`;
  try {
    const { stdout, stderr } = await promisify(execFile)(process.execPath, [script, ...args], {
      cwd: emptyDir,
      env: { MONGODB_URI: uri.toString() },
      timeout: 20_000,
    });
    return { exitCode: 0, stdout, stderr };
  } catch (error) {
    return { exitCode: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

describe('resetting a password from the command line', () => {
  it("prints a new password that logs in, and ends the account's sessions", async () => {
    const browser = await signedUpBrowser(context.app, 'locked-out@example.com');

    const result = await resetPassword(' Locked-Out@Example.com');
    expect(result.exitCode).toBe(0);
    const newPassword = result.stdout.match(/New password: (\S+)/)?.[1];
    expect(newPassword).toBeDefined();

    expect((await logIn(context.app,'locked-out@example.com', newPassword)).status).toBe(200);
    expect((await logIn(context.app,'locked-out@example.com', PASSWORD)).status).toBe(401);
    expect((await browser.get('/api/auth/me')).status).toBe(401);
  });

  it('fails, naming the email, when no account has it', async () => {
    const result = await resetPassword('nobody-here@example.com');

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('nobody-here@example.com');
  });

  it('fails, saying what to give it, when given no email', async () => {
    const result = await resetPassword();

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/email/i);
  });
});
