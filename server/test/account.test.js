import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { applicationModel } from '../src/applications.js';
import { PASSWORD, logIn, loggedInBrowser, signedUpBrowser } from './support/http.js';
import { useTestApp } from './support/testApp.js';

const context = useTestApp();

const NEW_PASSWORD = 'staple orbit lantern';

describe('changing the password', () => {
  it('logs in with the new password, and no longer with the old one', async () => {
    const browser = await signedUpBrowser(context.app, 'change-password@example.com');

    const change = await browser
      .put('/api/auth/password')
      .send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
    expect(change.status).toBe(204);

    expect((await logIn(context.app,'change-password@example.com', NEW_PASSWORD)).status).toBe(200);
    expect((await logIn(context.app,'change-password@example.com', PASSWORD)).status).toBe(401);
  });

  it('refuses a wrong current password with an error, keeping the old password', async () => {
    const browser = await signedUpBrowser(context.app, 'wrong-current@example.com');

    const change = await browser
      .put('/api/auth/password')
      .send({ currentPassword: 'not the password', newPassword: NEW_PASSWORD });
    expect(change.status).toBe(403);
    expect(change.body.error).toMatch(/current password/i);

    expect((await logIn(context.app,'wrong-current@example.com', PASSWORD)).status).toBe(200);
    expect((await logIn(context.app,'wrong-current@example.com', NEW_PASSWORD)).status).toBe(401);
  });

  it.each([
    ['9 characters', 'a'.repeat(9)],
    ['129 characters', 'a'.repeat(129)],
    ['not text', { $gt: '' }],
  ])('refuses a new password of %s with 400, keeping the old one', async (label, newPassword) => {
    const email = `new-password-${label.replace(/\s/g, '-')}@example.com`;
    const browser = await signedUpBrowser(context.app, email);

    const change = await browser
      .put('/api/auth/password')
      .send({ currentPassword: PASSWORD, newPassword });
    expect(change.status).toBe(400);
    expect(change.body.error).toMatch(/10–128 characters/);

    expect((await logIn(context.app,email, PASSWORD)).status).toBe(200);
  });

  it("ends the account's other sessions, and keeps this one and other accounts'", async () => {
    const browser = await signedUpBrowser(context.app, 'sessions-end@example.com');
    const otherDevice = await loggedInBrowser(context.app, 'sessions-end@example.com');
    const otherAccount = await signedUpBrowser(context.app, 'sessions-stay@example.com');

    const change = await browser
      .put('/api/auth/password')
      .send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
    expect(change.status).toBe(204);

    expect((await browser.get('/api/auth/me')).status).toBe(200);
    expect((await otherDevice.get('/api/auth/me')).status).toBe(401);
    expect((await otherDevice.get('/api/applications')).status).toBe(401);
    expect((await otherAccount.get('/api/auth/me')).status).toBe(200);
  });
});

describe('deleting the account', () => {
  it('deletes it and ends every one of its sessions', async () => {
    const browser = await signedUpBrowser(context.app, 'delete-me@example.com');
    const otherDevice = await loggedInBrowser(context.app, 'delete-me@example.com');

    const deletion = await browser.delete('/api/auth/account').send({ password: PASSWORD });
    expect(deletion.status).toBe(204);

    expect((await browser.get('/api/auth/me')).status).toBe(401);
    expect((await otherDevice.get('/api/auth/me')).status).toBe(401);
    expect((await otherDevice.get('/api/applications')).status).toBe(401);
    expect((await logIn(context.app,'delete-me@example.com', PASSWORD)).status).toBe(401);
  });

  // Nothing left through the API can see a deleted account's applications, so
  // the database is asked directly.
  it("deletes its applications, and no other account's", async () => {
    const browser = await signedUpBrowser(context.app, 'delete-data@example.com');
    const other = await signedUpBrowser(context.app, 'keep-data@example.com');
    const accountId = (await browser.get('/api/auth/me')).body.id;
    await browser.put('/api/applications/kowhai-labs').send({ company: 'Kōwhai Labs' });
    await browser.put('/api/applications/tui-robotics').send({ company: 'Tūī Robotics' });
    await other.put('/api/applications/kowhai-labs').send({ company: 'Kōwhai Labs' });

    const deletion = await browser.delete('/api/auth/account').send({ password: PASSWORD });
    expect(deletion.status).toBe(204);

    expect(await applicationModel(context.db).countDocuments({ accountId })).toBe(0);
    const otherList = await other.get('/api/applications');
    expect(otherList.body).toEqual([expect.objectContaining({ id: 'kowhai-labs' })]);
  });

  it.each([
    ['a wrong password', { password: 'not the password' }],
    ['no password', {}],
  ])('refuses %s with 403, deleting nothing', async (label, body) => {
    const email = `keep-account-${label.replace(/\s/g, '-')}@example.com`;
    const browser = await signedUpBrowser(context.app, email);
    await browser.put('/api/applications/kowhai-labs').send({ company: 'Kōwhai Labs' });

    const deletion = await browser.delete('/api/auth/account').send(body);
    expect(deletion.status).toBe(403);
    expect(deletion.body.error).toMatch(/password/i);

    expect((await browser.get('/api/auth/me')).status).toBe(200);
    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([expect.objectContaining({ id: 'kowhai-labs' })]);
    expect((await logIn(context.app,email, PASSWORD)).status).toBe(200);
  });

  it.each([
    ['change the password', (app) => request(app).put('/api/auth/password')],
    ['delete the account', (app) => request(app).delete('/api/auth/account')],
  ])('refuses to %s without logging in', async (_action, send) => {
    const response = await send(context.app).send({
      password: PASSWORD,
      currentPassword: PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    expect(response.status).toBe(401);
  });
});
