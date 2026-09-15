import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { loggedInBrowser, signedUpBrowser } from './support/http.js';
import { useTestApp } from './support/testApp.js';

const context = useTestApp();

describe('without logging in', () => {
  it.each([
    ['list', (app) => request(app).get('/api/applications')],
    [
      'save',
      (app) => request(app).put('/api/applications/anything').send({ company: 'Kōwhai Labs' }),
    ],
    [
      'change',
      (app) => request(app).patch('/api/applications/anything').send({ status: 'Interview' }),
    ],
    ['delete', (app) => request(app).delete('/api/applications/anything').send({})],
  ])('refuses to %s applications with 401', async (_action, send) => {
    const response = await send(context.app);

    expect(response.status).toBe(401);
  });
});

describe('saving an application', () => {
  it('creates it with PUT, and the account then lists it', async () => {
    const browser = await signedUpBrowser(context.app, 'first-save@example.com');

    const put = await browser
      .put('/api/applications/kowhai-labs')
      .send({ company: 'Kōwhai Labs', role: 'Graduate Software Engineer' });
    expect(put.status).toBe(200);

    const list = await browser.get('/api/applications');
    expect(list.status).toBe(200);
    expect(list.body).toEqual([
      {
        id: 'kowhai-labs',
        company: 'Kōwhai Labs',
        role: 'Graduate Software Engineer',
        status: 'Not started',
        date: '',
        priority: 0,
        jobPostingUrl: '',
        summary: '',
        details: '',
        category: '',
        roleType: '',
        locations: [],
      },
    ]);
  });

  it('merges only the given fields with PUT when the application already exists', async () => {
    const browser = await signedUpBrowser(context.app, 'merge-put@example.com');
    await browser
      .put('/api/applications/harbour-health')
      .send({ company: 'Harbour Health', role: 'Data Analyst' });

    const put = await browser.put('/api/applications/harbour-health').send({ status: 'Submitted' });
    expect(put.status).toBe(200);

    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([
      expect.objectContaining({
        company: 'Harbour Health',
        role: 'Data Analyst',
        status: 'Submitted',
      }),
    ]);
  });

  // The browser retries a first save that seemed to fail, which may already
  // have landed.
  it('can be retried with PUT without making a second application', async () => {
    const browser = await signedUpBrowser(context.app, 'retry-put@example.com');
    const firstSave = { company: 'Tūī Robotics', priority: 4 };

    await browser.put('/api/applications/tui-robotics').send(firstSave);
    const retry = await browser.put('/api/applications/tui-robotics').send(firstSave);
    expect(retry.status).toBe(200);

    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([expect.objectContaining(firstSave)]);
  });

  // A retry can go out while the first attempt is still on its way.
  it('takes the same first PUT several times at once as one application', async () => {
    const browser = await signedUpBrowser(context.app, 'concurrent-put@example.com');
    const firstSave = { company: 'Riroriro Studio' };

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        browser.put('/api/applications/riroriro-studio').send(firstSave),
      ),
    );
    expect(responses.map((response) => response.status)).toEqual([200, 200, 200, 200, 200]);

    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([expect.objectContaining(firstSave)]);
  });
});

describe('changing an application', () => {
  it('merges only the fields sent with PATCH', async () => {
    const browser = await signedUpBrowser(context.app, 'patch@example.com');
    await browser
      .put('/api/applications/fern-analytics')
      .send({ company: 'Fern Analytics', summary: 'Phone screen booked' });

    const patch = await browser
      .patch('/api/applications/fern-analytics')
      .send({ status: 'Interview' });
    expect(patch.status).toBe(200);

    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([
      expect.objectContaining({
        company: 'Fern Analytics',
        summary: 'Phone screen booked',
        status: 'Interview',
      }),
    ]);
  });

  it('answers 404 with PATCH for an application never saved, and creates nothing', async () => {
    const browser = await signedUpBrowser(context.app, 'patch-missing@example.com');

    const patch = await browser
      .patch('/api/applications/never-saved')
      .send({ status: 'Interview' });
    expect(patch.status).toBe(404);

    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([]);
  });

  // Two devices editing one application: the last write wins per field, not
  // per application (ADR-0008).
  it('keeps PATCHes to different fields from two sessions', async () => {
    const laptop = await signedUpBrowser(context.app, 'two-devices@example.com');
    const phone = await loggedInBrowser(context.app, 'two-devices@example.com');
    await laptop.put('/api/applications/pohutukawa-games').send({ company: 'Pōhutukawa Games' });

    await laptop
      .patch('/api/applications/pohutukawa-games')
      .send({ summary: 'Take-home test sent' });
    await phone.patch('/api/applications/pohutukawa-games').send({ priority: 3 });

    const list = await laptop.get('/api/applications');
    expect(list.body).toEqual([
      expect.objectContaining({
        company: 'Pōhutukawa Games',
        summary: 'Take-home test sent',
        priority: 3,
      }),
    ]);
  });
});

describe('deleting an application', () => {
  it('removes that one application and leaves the rest', async () => {
    const browser = await signedUpBrowser(context.app, 'delete@example.com');
    await browser.put('/api/applications/kereru-energy').send({ company: 'Kererū Energy' });
    await browser.put('/api/applications/weka-logistics').send({ company: 'Weka Logistics' });

    const removal = await browser.delete('/api/applications/weka-logistics').send({});
    expect(removal.status).toBe(204);

    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([expect.objectContaining({ id: 'kereru-energy' })]);
  });

  it('answers 404 with DELETE for an application that was never saved', async () => {
    const browser = await signedUpBrowser(context.app, 'delete-missing@example.com');

    const removal = await browser.delete('/api/applications/never-saved').send({});

    expect(removal.status).toBe(404);
  });
});

// Another account's application and one that doesn't exist look the same, so
// nothing about other accounts is revealed.
describe("another account's applications", () => {
  async function twoAccounts(label) {
    const owner = await signedUpBrowser(context.app, `${label}-owner@example.com`);
    const other = await signedUpBrowser(context.app, `${label}-other@example.com`);
    await owner
      .put('/api/applications/kakapo-studio')
      .send({ company: 'Kākāpō Studio', status: 'Interview' });
    return { owner, other };
  }

  it('are not listed', async () => {
    const { other } = await twoAccounts('list');

    const list = await other.get('/api/applications');

    expect(list.body).toEqual([]);
  });

  it('answer 404 to PATCH and stay unchanged', async () => {
    const { owner, other } = await twoAccounts('patch');

    const patch = await other.patch('/api/applications/kakapo-studio').send({ status: 'Rejected' });
    expect(patch.status).toBe(404);

    const list = await owner.get('/api/applications');
    expect(list.body).toEqual([expect.objectContaining({ status: 'Interview' })]);
  });

  it('answer 404 to DELETE and are kept', async () => {
    const { owner, other } = await twoAccounts('delete');

    const removal = await other.delete('/api/applications/kakapo-studio').send({});
    expect(removal.status).toBe(404);

    const list = await owner.get('/api/applications');
    expect(list.body).toEqual([expect.objectContaining({ id: 'kakapo-studio' })]);
  });

  // IDs only have to be unique within an account, so the same ID is a
  // separate application for each account.
  it('are untouched when another account PUTs the same ID', async () => {
    const { owner, other } = await twoAccounts('put');

    const put = await other
      .put('/api/applications/kakapo-studio')
      .send({ company: 'Someone else' });
    expect(put.status).toBe(200);

    const ownerList = await owner.get('/api/applications');
    expect(ownerList.body).toEqual([
      expect.objectContaining({ company: 'Kākāpō Studio', status: 'Interview' }),
    ]);
    const otherList = await other.get('/api/applications');
    expect(otherList.body).toEqual([
      expect.objectContaining({ company: 'Someone else', status: 'Not started' }),
    ]);
  });
});

describe('unknown fields', () => {
  it('are dropped, so a save cannot set the owner or bring back old fields', async () => {
    const owner = await signedUpBrowser(context.app, 'unknown-fields-owner@example.com');
    const other = await signedUpBrowser(context.app, 'unknown-fields-other@example.com');
    const otherAccountId = (await other.get('/api/auth/me')).body.id;

    const put = await owner.put('/api/applications/takahe-media').send({
      company: 'Takahē Media',
      accountId: otherAccountId,
      _id: '0123456789abcdef01234567',
      notes: 'an old field name',
      cv: { name: 'cv.pdf' },
      $set: { status: 'Offer' },
    });
    expect(put.status).toBe(200);

    const ownerList = await owner.get('/api/applications');
    expect(ownerList.body).toEqual([
      {
        id: 'takahe-media',
        company: 'Takahē Media',
        role: '',
        status: 'Not started',
        date: '',
        priority: 0,
        jobPostingUrl: '',
        summary: '',
        details: '',
        category: '',
        roleType: '',
        locations: [],
      },
    ]);
    const otherList = await other.get('/api/applications');
    expect(otherList.body).toEqual([]);
  });
});

describe('invalid values', () => {
  const INVALID = [
    ['an unknown status', { status: 'Ghosted' }],
    ['a priority above 5', { priority: 6 }],
    ['a priority below 0', { priority: -1 }],
    ['a priority that is not a whole number', { priority: 2.5 }],
    ['a query operator in place of text', { company: { $gt: '' } }],
    ['a query operator in place of a status', { status: { $ne: null } }],
  ];

  function emailFor(action, label) {
    return `invalid-${action}-${label.replace(/\W+/g, '-')}@example.com`;
  }

  it.each(INVALID)(
    'are refused with 400 when a new application has %s, and nothing is saved',
    async (label, fields) => {
      const browser = await signedUpBrowser(context.app, emailFor('put', label));

      const put = await browser
        .put('/api/applications/moa-finance')
        .send({ company: 'Moa Finance', ...fields });
      expect(put.status).toBe(400);
      expect(put.body.error).toEqual(expect.any(String));

      const list = await browser.get('/api/applications');
      expect(list.body).toEqual([]);
    },
  );

  it.each(INVALID)(
    'are refused with 400 when a PATCH sends %s, and the application is unchanged',
    async (label, fields) => {
      const browser = await signedUpBrowser(context.app, emailFor('patch', label));
      await browser
        .put('/api/applications/moa-finance')
        .send({ company: 'Moa Finance', status: 'Submitted', priority: 2 });

      const patch = await browser.patch('/api/applications/moa-finance').send(fields);
      expect(patch.status).toBe(400);

      const list = await browser.get('/api/applications');
      expect(list.body).toEqual([
        expect.objectContaining({ company: 'Moa Finance', status: 'Submitted', priority: 2 }),
      ]);
    },
  );
});
