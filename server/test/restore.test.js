import { describe, expect, it } from 'vitest';
import { signedUpBrowser } from './support/http.js';
import { useTestApp } from './support/testApp.js';

const context = useTestApp();

describe('restoring a backup', () => {
  it("replaces every application in the account, and no other account's", async () => {
    const browser = await signedUpBrowser(context.app, 'restore-replaces@example.com');
    const other = await signedUpBrowser(context.app, 'restore-replaces-other@example.com');
    await browser.put('/api/applications/weka-logistics').send({ company: 'Weka Logistics' });
    await browser.put('/api/applications/kereru-energy').send({ company: 'Kererū Energy' });
    await other.put('/api/applications/weka-logistics').send({ company: 'Weka Logistics' });

    const restore = await browser
      .post('/api/restore')
      .send([{ id: 'kereru-energy', company: 'Kererū Energy', status: 'Offer' }]);
    expect(restore.status).toBe(200);

    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([
      expect.objectContaining({ id: 'kereru-energy', company: 'Kererū Energy', status: 'Offer' }),
    ]);
    const otherList = await other.get('/api/applications');
    expect(otherList.body).toEqual([expect.objectContaining({ id: 'weka-logistics' })]);
  });
});

describe('restoring a version 1 backup', () => {
  it('takes a bare list of applications, and the account then lists them', async () => {
    const browser = await signedUpBrowser(context.app, 'restore-v1@example.com');

    const restore = await browser.post('/api/restore').send([
      { id: 'kowhai-labs', company: 'Kōwhai Labs', role: 'Graduate Software Engineer' },
    ]);
    expect(restore.status).toBe(200);

    const list = await browser.get('/api/applications');
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
});

describe('restoring a version 3 backup', () => {
  it('takes the applications exactly as Download backup saved them', async () => {
    const browser = await signedUpBrowser(context.app, 'restore-v3@example.com');
    const applications = [
      {
        id: '0f6c2b1e-7a4d-4c61-9d0b-2f5e8a3c1b7d',
        company: 'Tūī Robotics',
        role: 'Junior Robotics Engineer',
        status: 'Interview',
        date: '3 Aug 2026',
        priority: 4,
        jobPostingUrl: 'https://example.com/careers/junior-robotics-engineer',
        summary: 'Second interview on Friday',
        details: '## Prep\n\n- Revise kinematics',
        category: 'Software development',
        roleType: 'Graduate programme',
        locations: ['Auckland', 'Remote'],
      },
    ];

    const restore = await browser.post('/api/restore').send({
      format: 'vc-application-tracker',
      version: 3,
      exportedAt: '2026-09-14T08:00:00.000Z',
      applications,
    });
    expect(restore.status).toBe(200);
    expect(restore.body).toEqual(applications);

    const list = await browser.get('/api/applications');
    expect(list.body).toEqual(applications);
  });
});

// A restore is all or nothing, so a bad file never leaves an account with
// half its applications.
describe('a file that cannot be restored', () => {
  const EXISTING = { company: 'Moa Finance', status: 'Submitted', priority: 2 };

  async function accountWithAnApplication(slug) {
    const browser = await signedUpBrowser(context.app, `unrestorable-${slug}@example.com`);
    await browser.put('/api/applications/moa-finance').send(EXISTING);
    return browser;
  }

  async function expectUnchanged(browser) {
    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([expect.objectContaining({ id: 'moa-finance', ...EXISTING })]);
  }

  it.each([
    ['holds no applications', 'no-applications', { version: 3, exportedAt: '2026-09-14' }],
    [
      'is a version this tracker never made',
      'unknown-version',
      { version: 4, applications: [{ id: 'kowhai-labs', company: 'Kōwhai Labs' }] },
    ],
    ['has an application that is not an object', 'not-an-object', ['Kōwhai Labs']],
    // The server never makes up an id for an application (ADR-0007).
    ['has an application with no id', 'no-id', [{ company: 'Kōwhai Labs' }]],
    [
      'has an invalid value after valid applications',
      'invalid-value',
      [
        { id: 'kowhai-labs', company: 'Kōwhai Labs' },
        { id: 'tui-robotics', company: 'Tūī Robotics', status: 'Ghosted' },
      ],
    ],
    [
      'has two applications with the same id',
      'duplicate-id',
      [
        { id: 'kowhai-labs', company: 'Kōwhai Labs' },
        { id: 'kowhai-labs', company: 'Kōwhai Labs again' },
      ],
    ],
    [
      'has a query operator in place of text',
      'operator',
      [{ id: 'kowhai-labs', company: { $gt: '' } }],
    ],
  ])('is refused with 400 when it %s, and nothing changes', async (_case, slug, backup) => {
    const browser = await accountWithAnApplication(slug);

    const restore = await browser.post('/api/restore').send(backup);
    expect(restore.status).toBe(400);
    expect(restore.body.error).toEqual(expect.any(String));

    await expectUnchanged(browser);
  });

  it('is refused with 400 when the request is empty, and nothing changes', async () => {
    const browser = await accountWithAnApplication('empty');

    const restore = await browser.post('/api/restore').set('Content-Type', 'application/json');
    expect(restore.status).toBe(400);
    expect(restore.body.error).toEqual(expect.any(String));

    await expectUnchanged(browser);
  });

  it('is refused with 400 when it is not JSON, and nothing changes', async () => {
    const browser = await accountWithAnApplication('not-json');

    const restore = await browser
      .post('/api/restore')
      .set('Content-Type', 'application/json')
      .send('# Job Application Tracker');
    expect(restore.status).toBe(400);
    expect(restore.body.error).toEqual(expect.any(String));

    await expectUnchanged(browser);
  });
});

// Older trackers stored the summary as `notes` and the details as `detail`
// (ADR-0011).
describe('converting older applications', () => {
  it('renames notes and detail, drops unknown fields and fills in defaults', async () => {
    const browser = await signedUpBrowser(context.app, 'restore-convert@example.com');

    const restore = await browser.post('/api/restore').send([
      {
        id: 'fern-analytics',
        company: 'Fern Analytics',
        status: 'Submitted',
        notes: 'Phone screen booked',
        detail: '## Contacts\n\n- Aroha, hiring manager',
        favourite: true,
      },
    ]);
    expect(restore.status).toBe(200);

    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([
      {
        id: 'fern-analytics',
        company: 'Fern Analytics',
        role: '',
        status: 'Submitted',
        date: '',
        priority: 0,
        jobPostingUrl: '',
        summary: 'Phone screen booked',
        details: '## Contacts\n\n- Aroha, hiring manager',
        category: '',
        roleType: '',
        locations: [],
      },
    ]);
  });
});

// From when the tracker had CV and cover letter attachments (ADR-0009). The
// files go, and so do the stubs on each application that pointed at them.
describe('restoring a version 2 backup', () => {
  it('takes the applications and leaves the attachments behind', async () => {
    const browser = await signedUpBrowser(context.app, 'restore-v2@example.com');

    const restore = await browser.post('/api/restore').send({
      format: 'vc-application-tracker',
      version: 2,
      exportedAt: '2026-08-03T09:15:00.000Z',
      applications: [
        {
          id: 'harbour-health',
          company: 'Harbour Health',
          role: 'Data Analyst',
          cv: { id: 'file-1', name: 'cv.pdf', size: 48213 },
          coverLetter: { id: 'file-2', name: 'cover-letter.pdf', size: 20114 },
        },
      ],
      attachments: [
        {
          id: 'file-1',
          name: 'cv.pdf',
          type: 'application/pdf',
          size: 48213,
          addedAt: '2026-08-01T10:00:00.000Z',
          data: 'JVBERi0xLjcK',
        },
      ],
    });
    expect(restore.status).toBe(200);

    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([
      {
        id: 'harbour-health',
        company: 'Harbour Health',
        role: 'Data Analyst',
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

  // Attachments were kept in the backup as base64, so a version 2 file can be
  // much bigger than an ordinary request.
  it('takes a backup made large by its attachments', async () => {
    const browser = await signedUpBrowser(context.app, 'restore-v2-large@example.com');

    const restore = await browser.post('/api/restore').send({
      version: 2,
      applications: [{ id: 'harbour-health', company: 'Harbour Health', cv: { id: 'file-1' } }],
      attachments: [{ id: 'file-1', name: 'cv.pdf', data: 'A'.repeat(3 * 1024 * 1024) }],
    });
    expect(restore.status).toBe(200);

    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([expect.objectContaining({ company: 'Harbour Health' })]);
  });
});

// Before locations were tags, an application had one location as text.
describe('restoring applications with a single location', () => {
  it('keeps it as their only location, unless they already have a list', async () => {
    const browser = await signedUpBrowser(context.app, 'restore-location@example.com');

    const restore = await browser.post('/api/restore').send([
      { id: 'kowhai-labs', company: 'Kōwhai Labs', location: 'Wellington' },
      {
        id: 'tui-robotics',
        company: 'Tūī Robotics',
        location: 'Wellington',
        locations: ['Auckland', 'Remote'],
      },
    ]);
    expect(restore.status).toBe(200);

    const list = await browser.get('/api/applications');
    expect(list.body).toEqual([
      expect.objectContaining({ id: 'kowhai-labs', locations: ['Wellington'] }),
      expect.objectContaining({ id: 'tui-robotics', locations: ['Auckland', 'Remote'] }),
    ]);
  });
});
