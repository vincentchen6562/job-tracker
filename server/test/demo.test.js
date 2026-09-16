import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { accountModel } from '../src/accounts.js';
import { applicationModel } from '../src/applications.js';
import {
  FIFTEEN_MINUTES_MS,
  PASSWORD,
  sessionCookieHeader,
  signedUpBrowser,
} from './support/http.js';
import { useTestApp } from './support/testApp.js';

const context = useTestApp();

const GENEROUS = { limit: 1000, windowMs: FIFTEEN_MINUTES_MS };

// A demo lasts a day (ADR-0005), written out here rather than taken from the
// server's own constant so the test states the decision instead of echoing it.
const A_DAY_MS = 24 * 60 * 60 * 1000;

// The applications every demo account starts with, as seedData.js holds them.
const SEED_IDS = [
  'kowhai-labs',
  'tidewater-health',
  'harakeke-analytics',
  'southern-lights-bank',
  'puriri-energy',
  'mohio-design-studio',
];

// A browser that has just pressed "Try the demo", so its requests are logged
// in to a demo account of its own.
async function demoBrowser(app = context.app) {
  const browser = request.agent(app);
  const response = await browser.post('/api/auth/demo').send({});
  if (response.status !== 201) {
    throw new Error(`Starting a demo failed with ${response.status}.`);
  }
  return browser;
}

describe('trying the demo', () => {
  it('creates a demo account holding the seed data, logged in straight away', async () => {
    const browser = request.agent(context.app);

    const demo = await browser.post('/api/auth/demo').send({});
    expect(demo.status).toBe(201);
    expect(demo.body).toMatchObject({ isDemo: true });
    // A demo account has no email and no password to sign up with.
    expect(demo.body.email).toBeUndefined();

    const me = await browser.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.id).toBe(demo.body.id);

    const list = await browser.get('/api/applications');
    expect(list.body.map((application) => application.id)).toEqual(SEED_IDS);
    expect(list.body[0]).toMatchObject({
      company: 'Kōwhai Labs',
      status: 'Submitted',
      priority: 5,
    });
  });
});

// An expiry is never sent to the browser, so the database is asked directly.
describe('a demo account and its applications', () => {
  it('carry an expiry a day after the demo was created', async () => {
    const browser = request.agent(context.app);

    const before = Date.now();
    const demo = await browser.post('/api/auth/demo').send({});
    const after = Date.now();
    expect(demo.status).toBe(201);

    const account = await accountModel(context.db).findById(demo.body.id);
    expect(account.expiresAt.getTime()).toBeGreaterThanOrEqual(before + A_DAY_MS);
    expect(account.expiresAt.getTime()).toBeLessThanOrEqual(after + A_DAY_MS);

    const applications = await applicationModel(context.db).find({ accountId: demo.body.id });
    expect(applications).toHaveLength(SEED_IDS.length);
    // The same instant as the account's, so the two go together.
    applications.forEach((application) => {
      expect(application.expiresAt.getTime()).toBe(account.expiresAt.getTime());
    });
  });
});

// Each demo account costs a database's worth of seed data, and no password
// stands between a visitor and making one.
describe('creating demo accounts', () => {
  const limited = useTestApp({
    rateLimits: { auth: GENEROUS, api: GENEROUS, demo: { limit: 2, windowMs: FIFTEEN_MINUTES_MS } },
  });

  it('is limited per IP, answering 429 once the allowance is used up', async () => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const allowed = await request(limited.app).post('/api/auth/demo').send({});
      expect(allowed.status).toBe(201);
    }

    const response = await request(limited.app).post('/api/auth/demo').send({});

    expect(response.status).toBe(429);
    expect(response.body.error).toEqual(expect.any(String));
  });
});

describe('each visitor', () => {
  it("gets a demo account of their own, and never sees another's changes", async () => {
    const first = request.agent(context.app);
    const second = request.agent(context.app);

    const firstDemo = await first.post('/api/auth/demo').send({});
    const secondDemo = await second.post('/api/auth/demo').send({});
    expect(firstDemo.body.id).not.toBe(secondDemo.body.id);

    const edit = await first
      .patch('/api/applications/kowhai-labs')
      .send({ company: 'Renamed by the first visitor' });
    expect(edit.status).toBe(200);

    const secondList = await second.get('/api/applications');
    expect(secondList.body[0]).toMatchObject({ id: 'kowhai-labs', company: 'Kōwhai Labs' });
  });
});

// The account settings make no sense for a demo: it has no password to
// change, and it deletes itself. Locking them out is why the account page
// offers signing up instead.
describe('a demo account', () => {
  it.each([
    [
      'change its password',
      (browser) =>
        browser
          .put('/api/auth/password')
          .send({ currentPassword: PASSWORD, newPassword: 'staple orbit lantern' }),
    ],
    ['delete itself', (browser) => browser.delete('/api/auth/account').send({ password: PASSWORD })],
  ])('is refused with 403 when it tries to %s', async (_action, attempt) => {
    const browser = await demoBrowser();

    const response = await attempt(browser);

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/demo/i);
    // Refused, not logged out: the demo carries on as it was.
    expect((await browser.get('/api/auth/me')).status).toBe(200);
  });
});

// The account is deleted after a day, so a session lasting the usual thirty
// would leave a visitor logged in to nothing.
describe("a demo's session", () => {
  it('expires with the demo, not in the usual thirty days', async () => {
    const demo = await request(context.app).post('/api/auth/demo').send({});

    const expires = new Date(sessionCookieHeader(demo).match(/expires=([^;]+)/i)[1]);
    expect(expires.getTime()).toBeLessThanOrEqual(Date.now() + A_DAY_MS);
  });

  // `rolling` re-stamps the cookie on every response, so a visitor who keeps
  // using the demo could otherwise carry it past the account's own expiry.
  it('does not slide past the demo as the visitor keeps using it', async () => {
    const browser = await demoBrowser();
    const accountId = (await browser.get('/api/auth/me')).body.id;
    const account = await accountModel(context.db).findById(accountId);

    // Longer than the one-second resolution of an Expires header, so a cookie
    // that slides is visibly later than the account it belongs to.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const later = await browser.get('/api/applications');

    const expires = new Date(sessionCookieHeader(later).match(/expires=([^;]+)/i)[1]);
    expect(expires.getTime()).toBeLessThanOrEqual(account.expiresAt.getTime());
  });

  it('stops working once the demo has run out, before the account is deleted', async () => {
    const browser = await demoBrowser();
    const accountId = (await browser.get('/api/auth/me')).body.id;

    // Ages the session past the demo's expiry. The account itself is still
    // there: MongoDB clears expired documents on its own schedule, so the
    // session must not wait for that to happen.
    await context.db.collection('sessions').updateMany(
      { 'session.accountId': accountId },
      { $set: { 'session.demoExpiresAt': new Date(Date.now() - 1000).toISOString() } },
    );

    expect((await browser.get('/api/applications')).status).toBe(401);
    expect((await browser.get('/api/auth/me')).status).toBe(401);
  });
});

// Or it would outlive the demo it arrived in, with no account left to open it
// from.
describe('an application that reaches a demo after it starts', () => {
  it('expires with the demo when added by hand, like the seed data beside it', async () => {
    const browser = await demoBrowser();
    const accountId = (await browser.get('/api/auth/me')).body.id;

    const added = await browser
      .put('/api/applications/visitors-own')
      .send({ company: 'Weka Logistics' });
    expect(added.status).toBe(200);

    const account = await accountModel(context.db).findById(accountId);
    const stored = await applicationModel(context.db).findOne({ accountId, id: 'visitors-own' });
    expect(stored.expiresAt?.getTime()).toBe(account.expiresAt.getTime());
  });

  it('expires with the demo when restored from a backup', async () => {
    const browser = await demoBrowser();
    const accountId = (await browser.get('/api/auth/me')).body.id;

    const restore = await browser
      .post('/api/restore')
      .send([{ id: 'kereru-energy', company: 'Kererū Energy' }]);
    expect(restore.status).toBe(200);

    const account = await accountModel(context.db).findById(accountId);
    const stored = await applicationModel(context.db).findOne({ accountId, id: 'kereru-energy' });
    expect(stored.expiresAt?.getTime()).toBe(account.expiresAt.getTime());
  });
});

// A demo is a look around, not the beginnings of a real account: signing up
// gets an empty one (ADR-0005).
describe('signing up from a demo', () => {
  it('creates a new, empty account, and the demo\'s changes do not carry over', async () => {
    const browser = await demoBrowser();
    await browser.patch('/api/applications/kowhai-labs').send({ company: 'Edited in the demo' });

    const signup = await browser
      .post('/api/auth/signup')
      .send({ email: 'from-demo@example.com', password: PASSWORD });
    expect(signup.status).toBe(201);
    expect(signup.body).toMatchObject({ email: 'from-demo@example.com', isDemo: false });

    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([]);
  });
});

// Only a demo has seed data to go back to. A real account's applications are
// its own, and restoring a backup is how it replaces them.
describe('resetting to the seed data', () => {
  it("replaces everything the visitor did to the demo's applications", async () => {
    const browser = await demoBrowser();
    await browser.patch('/api/applications/kowhai-labs').send({ company: 'Edited by the visitor' });
    await browser.delete('/api/applications/tidewater-health');
    await browser.put('/api/applications/visitors-own').send({ company: 'Added by the visitor' });

    const reset = await browser.post('/api/applications/reset-to-seed').send({});
    expect(reset.status).toBe(200);
    expect(reset.body.map((application) => application.id)).toEqual(SEED_IDS);

    const list = await browser.get('/api/applications');
    expect(list.body.map((application) => application.id)).toEqual(SEED_IDS);
    expect(list.body[0]).toMatchObject({ company: 'Kōwhai Labs' });

    // The fresh applications expire with the demo, like the ones they replaced.
    const accountId = (await browser.get('/api/auth/me')).body.id;
    const stored = await applicationModel(context.db).find({ accountId });
    stored.forEach((application) => expect(application.expiresAt).toBeInstanceOf(Date));
  });

  // The applications router owns the rest of that path, and an application
  // whose id happened to be "reset-to-seed" must not be able to sit on it.
  it('is a path no other method can put an application at', async () => {
    const browser = await demoBrowser();

    const put = await browser.put('/api/applications/reset-to-seed').send({ company: 'Sneaky' });
    expect(put.status).toBe(405);

    const list = await browser.get('/api/applications');
    expect(list.body.map((application) => application.id)).toEqual(SEED_IDS);
  });

  it('is refused with 403 for a real account, which keeps its applications', async () => {
    const browser = await signedUpBrowser(context.app, 'no-reset@example.com');
    await browser.put('/api/applications/moa-finance').send({ company: 'Moa Finance' });

    const reset = await browser.post('/api/applications/reset-to-seed').send({});
    expect(reset.status).toBe(403);
    expect(reset.body.error).toMatch(/demo/i);

    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([expect.objectContaining({ id: 'moa-finance' })]);
  });
});

// The expiry only means anything if MongoDB is watching it: a TTL index of
// zero seconds deletes each document as soon as its own expiry passes.
describe('the TTL index', () => {
  it.each([
    ['accounts', () => accountModel(context.db)],
    ['applications', () => applicationModel(context.db)],
  ])('is on %s, and deletes a document as soon as its expiry passes', async (_name, model) => {
    const collection = model();
    // Resolves once Mongoose has finished building the model's indexes.
    await collection.init();

    const indexes = await collection.collection.indexes();
    const ttl = indexes.find((index) => index.key.expiresAt === 1);

    expect(ttl).toBeDefined();
    expect(ttl.expireAfterSeconds).toBe(0);
  });
});
