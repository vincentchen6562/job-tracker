// Seed data — fictional example applications.
// This only loads the first time you open the app. After that your saved
// data in localStorage wins. Use "Reset to seed data" in the toolbar to
// come back to this starting point.

export const STATUS_OPTIONS = [
  'Not started',
  'In progress',
  'Submitted',
  'Interview',
  'Offer',
  'Rejected',
  'Refused'
];

export const seedApplications = [
  {
    id: 'kowhai-labs',
    company: 'Kōwhai Labs',
    role: 'Graduate Software Engineer (2027 Grad Programme)',
    status: 'Submitted',
    date: '3 Aug 2026',
    priority: 5,
    jobPostingUrl: 'https://example.com/careers/kowhai-labs/graduate-software-engineer',
    notes: 'Online form. CV, cover letter and transcript uploaded.',
    detail: `### Target role

**Graduate Software Engineer — 2027 intake**
Kōwhai Labs · Auckland CBD · Applications close **15 August 2026**

### Why this one

- Small product team building scheduling software for community sports clubs.
- Rotations across the web app, the mobile app and the API.
- Mentoring and a structured first year.

### Fit

| Requirement | Evidence |
| --- | --- |
| Degree in computer science or similar | Yes |
| JavaScript and React | Two team projects |
| Testing habits | Unit and integration tests on the capstone project |
| Right to work in NZ | Yes |

### Next steps

- [x] Submit the application
- [ ] Follow up two weeks after close
- [ ] Prepare a walkthrough of the capstone project`,
  },
  {
    id: 'tidewater-health',
    company: 'Tidewater Health',
    role: 'Graduate Test Automation Engineer',
    status: 'Interview',
    date: 'Jul 2026',
    priority: 4,
    jobPostingUrl: 'https://example.com/careers/tidewater-health/test-automation',
    notes: 'Second-round technical interview booked.',
    detail: `### Target role

**Graduate Test Automation Engineer**
Tidewater Health · Wellington or Christchurch · Hybrid

Joins the team that tests patient-booking software used by regional clinics.

### Interview rounds

| Round | Format | Outcome |
| --- | --- | --- |
| 1 | Phone screen with the recruiter | Passed |
| 2 | Technical interview: write tests for a small booking API | Booked |
| 3 | Team fit with the QA lead | — |

### Prep

- Revise the testing pyramid and when end-to-end tests are worth their cost.
- Practise explaining a flaky test and how it was fixed.
- ~~Learn Selenium~~ They use Playwright, so practise that instead.`,
  },
  {
    id: 'harakeke-analytics',
    company: 'Harakeke Analytics',
    role: 'Junior Data Analyst',
    status: 'Offer',
    date: '28 Jul 2026',
    priority: 3,
    jobPostingUrl: 'https://example.com/careers/harakeke-analytics/junior-data-analyst',
    notes: 'Offer received. Reply due 11 Aug.',
    detail: `### Offer

**Junior Data Analyst** · 12-month fixed-term contract · Fully remote

| | Offer | Notes |
| --- | --- | --- |
| Salary | $62,000 | Below the market median for the role |
| Hours | 40 per week | Flexible start times |
| Equipment | Laptop provided | Home office allowance of $500 |
| Review | At 6 months | Possible move to permanent |

### Questions before deciding

- Is there a real path to a permanent role at 12 months?
- Who would I report to, and how often would we meet?

### Decision

Waiting on the other interviews before replying.`,
  },
  {
    id: 'southern-lights-bank',
    company: 'Southern Lights Bank',
    role: 'Summer Intern — Cyber Security',
    status: 'Rejected',
    date: '12 Jun 2026',
    priority: 2,
    jobPostingUrl: 'https://example.com/careers/southern-lights-bank/summer-intern-security',
    notes: 'Rejected after the online assessment.',
    detail: `### Target role

**Summer Internship — Cyber Security**
Southern Lights Bank · Dunedin · 12 weeks over summer

### What happened

1. Applied through the careers site.
2. Online assessment: logic puzzles and a timed networking quiz.
3. Rejection email a week later, with no feedback.

### Takeaways

- The networking questions were the weak spot. Work through a networking fundamentals course before next year's round.
- Apply earlier: the ad closed a week sooner than expected.`,
  },
  {
    id: 'puriri-energy',
    company: 'Pūriri Energy',
    role: 'IT Service Desk Analyst',
    status: 'In progress',
    date: '',
    priority: 0,
    jobPostingUrl: 'https://example.com/careers/puriri-energy/service-desk-analyst',
    notes: 'Cover letter half written.',
    detail: `### Target role

**IT Service Desk Analyst**
Pūriri Energy · Hamilton · Full time · Rotating roster, one weekend in four

### To do

- [x] Read the job description properly
- [x] Tailor the CV summary
- [ ] Finish the cover letter
- [ ] Ask a friend who works in IT support what the roster is really like`,
  },
  {
    id: 'mohio-design-studio',
    company: 'Mohio Design Studio',
    role: '',
    status: 'Not started',
    date: '',
    priority: 1,
    jobPostingUrl: '',
    notes: 'Met them at a careers fair. Find the posting.',
    detail: `### Notes

Nothing captured yet. Add the role title, the posting link, and what the ad asks for.`,
  },
];
