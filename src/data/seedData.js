// Seed data — mirrors the original tracker markdown.
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
];

export const seedApplications = [
  {
    id: 'serato',
    company: 'Serato',
    role: 'Graduate Software Developer (2026 Grad Programme)',
    status: 'Submitted',
    date: '3 Aug 2026',
    priority: 5,
    jobPostingUrl: '',
    notes: 'Textbox submission. Cover letter + transcript attached.',
    detail: `### Target role

**2026 Serato Graduate Programme — Software Development**
Serato Limited · Auckland CBD · Full time · Applications closed **8 August 2026**
Required: cover letter + academic transcript.

### Company context

- Auckland-based music software company (est. 1998), roughly 150–200 staff. Culture reads as passionate, music-centric — many staff are DJs or musicians.
- Majority acquired by Tiny Ltd. (66% stake) in March 2025, citing a 2M+ user base. Operates as a standalone brand, Auckland team retained.
- Genuine music interest is a real cultural signal here, not filler.

### Fit

| Requirement | Status |
| --- | --- |
| CS degree, GPA 7+ | Yes — 7.125, stated on CV |
| Communication & teamwork | Strong (retail, project teams, mentoring) |
| Agentic engineering practices | Named and evidenced (Claude Code, 460+ test suite) |
| Passion for technology and music | Tech clear; music included (school band, choir) |
| Right to work in NZ | Open Work Visa |
| Auckland CBD travel | Already Auckland-based |

### Decisions made

- Title changed to "Graduate Software Developer" for this application only — matches the ad, removes level ambiguity.
- GPA added explicitly next to the postgrad diploma.
- Agentic engineering promoted to a Core skill, evidenced via GrowFriend's 460+ test suite.
- Music background kept to one short clause in the profile.
- Visa stated as "Open Work Visa" rather than "Partner of a Student Work Visa" — same legal category, more recognisable to recruiters.
- Skills split into Technical Skills (Core / Familiar / Learning next) and Key Strengths.
- Problem Solving line kept abstract to avoid repeating the Project Experience section below it.
- Time Management strength cut — weakest, least evidenced point.
- Delivery Driver role compressed from four bullets to one line.
- Door-to-door sales and wait staff left off — redundant with Aelia Duty Free.
- Salutation switched to "Dear Serato Hiring Team" once it turned out to be a plain textbox, likely ATS-routed.

### Cover letter (as submitted)

Dear Serato Hiring Team,

Hey, I am Vincent. I am applying for the 2026 Serato Graduate Programme in Software Development. Being able to contribute to Kiwi-built software like Serato DJ Pro, used by over 2 million DJs and producers worldwide, is what drew me to this role. I bring a full-stack skill set, a rigorous approach to testing, and a habit of building efficient, well-documented systems to a dependable app that DJs and producers use to perform live.

I recently completed a Postgraduate Diploma in Science (Computer Science) at the University of Auckland, earning a Distinction and 7.125 GPA. Previously, I graduated from the University of Canterbury with a Bachelor of Science in Computer Science. My tech stack includes JavaScript, Python, and the MERN stack. I've adopted an agentic engineering workflow and use Claude Code inside a Linux/Neovim setup to scaffold features, generate test coverage, and refactor code. On my recent project, GrowFriend, a gamified productivity app built with a six-person Scrum team, the workflow helped me build and maintain a 460+ test suite.

Outside of coursework, I tinker with technology and integrate cutting-edge tools into my personal life. I use Linux as my main system for exactly that reason: I love how much you can customise, and it lets me make the most of my setup by implementing the latest efficiency gains as they come out, rather than waiting on someone else's release cycle.

Music's been part of my life as long as code has. I was part of my high school's guitar band and the choir. I'm not coming to Serato purely as an engineer chasing a graduate role; I love the idea of using technology to enhance human creativity and expression.

My experience in retail and hospitality taught me to stay calm, communicate clearly, and problem-solve under pressure. I believe these habits translate well into collaborative, deadline-driven project work.

I would love to bring my technical skills, curiosity, and genuine interest in Serato's work to the graduate programme. I would love to chat further on a call or in an interview at a time that suits you.

Kind regards,
Vincent Chen

### Next steps

- Follow up if nothing lands by roughly two weeks after the 8 August close.
- Prep interview talking points around GrowFriend and the agentic workflow.`,
  },
  {
    id: 'orion-health',
    company: 'Orion Health',
    role: 'Technical Graduate Programme: Software Engineering and Implementation',
    status: 'In progress',
    date: '5 Aug 2026',
    priority: 5,
    jobPostingUrl: 'https://apply.workable.com/orion-health/j/E0CA9D08AF/',
    notes: 'Closes 5 Aug. Two recorded video answers required.',
    detail: `### Target role

**Technical Graduate Programme: Software Engineering and Implementation**
Orion Health · Auckland or Christchurch · Hybrid · Full time
Applications close **5 August 2026**, start late November 2026.
Permanent full-time contract, three rotations over twelve months.

### Fit

| Requirement | Status |
| --- | --- |
| CS or related degree | Strong — postgrad diploma (Distinction) plus bachelor's |
| Java experience | Covered through coursework, including a full-year Java project. Listed as Familiar, which matches what a grad ad expects |
| JavaScript / TypeScript, HTML/CSS, React | Strong — core skills |
| AWS or Azure | Gap — currently under "Learning next" |
| SQL and databases | Core skill, plus MongoDB |
| APIs and integrations | Strong — GrowFriend and Workout Tracker are both API-heavy |
| Linux, Bash, Git | Strong — daily-use, Linux/Neovim workflow |
| Analytical and problem-solving | Well evidenced |
| Communication | Well evidenced |

### Application format

Two recorded **video** answers, not text:

1. **Motivation to join us** — why Komodo… (note: the platform wording differs from the company name; confirm on submission). Why Orion Health specifically, what made you apply.
2. **Feedback reflection** — one piece of feedback from a previous manager, and what you applied as a result.

### Notes on the video answers

- Health-tech is the specific hook: technology that affects clinicians and patient care. That's more credible than generic enthusiasm and echoes the same "tools that matter to the people using them" thread used in the Serato letter.
- Feedback reflection needs a real, specific example. Draft and rehearse it rather than improvising on camera.
- Record in the morning while fresh, with buffer before the close time.

### The Java question

A full-year Java project counts, and a missing GitHub link is normal for coursework. Credibility comes from describing it specifically — what it did, what you built, what you learned — not from a URL. Don't pre-emptively explain that some projects aren't on GitHub; only address it if asked directly.

### Next steps

- Draft both video answers.
- Pick and rehearse the feedback example.
- Record and submit on the morning of 5 August.`,
  },
  {
    id: 'bremworth',
    company: 'Bremworth',
    role: 'Applications Specialist',
    status: 'In progress',
    date: '',
    priority: 4,
    jobPostingUrl: 'https://nz.seek.com/job/93350727',
    notes: 'Graduate-friendly. D365 gap is explicitly non-essential.',
    detail: `### Target role

**Applications Specialist**
Bremworth · Papatoetoe, Auckland · Hybrid, one day a week from home · Full time
Category: Business/Systems Analysts. Marked "Strong applicant" on the SEEK profile.

Support and improve business systems with a focus on **Microsoft Dynamics 365**. The ad explicitly welcomes early-career professionals, recent graduates, and people moving into enterprise applications, with training provided.

### Fit

| Requirement | Status |
| --- | --- |
| Tertiary CS/IT qualification | Strong — postgrad diploma (Distinction) plus bachelor's |
| Right to work in NZ | Open Work Visa. No "permanent residency" wording here |
| Application support / business analysis | Partial — no job titled this, but GrowFriend and Workout Tracker are relevant system-building evidence |
| SQL | Already a core skill |
| Problem-solving and analysis | Well evidenced |
| Stakeholder communication | Aelia Duty Free plus the FastAPI vs Express presentation |
| Customer-focused mindset | Strong via retail background |
| Learns new tech quickly | Supported by the agentic engineering narrative and self-taught projects |
| Dynamics 365 / ERP / CRM / Power Platform | Gap — the ad calls these beneficial, not essential |

### Employer questions to prepare

- Right to work in NZ — Open Work Visa.
- Years as an Application Specialist — zero, be upfront.
- CS qualification completed — yes.
- Technical support experience — frame via Aelia Duty Free and any informal IT troubleshooting.
- D365 certifications — none, which the ad's own framing anticipates.
- Data analytics tools — list only what's true (Excel, basic SQL).

### CV changes for this application

- **Title:** swap to "Graduate Applications Specialist" to match the ad's language.
- **Profile opening:** lead with a CS graduate interested in how technology supports business operations, rather than leading with software developer identity. Keep the rest — agentic engineering still shows fast tool adoption.
- **Problem Solving line:** reframe to "Debugged data integrity and access-control logic in a multi-user system (GrowFriend's role-based admin panel and transaction ledger)." Same evidence, closer to business-systems vocabulary.
- **Technical Skills:** no change. SQL is already core. Don't invent D365 or ERP exposure.

### Cover letter outline

- Open with the fit rather than enthusiasm: a recent CS graduate drawn to roles where technology supports how a business runs, not pure software development.
- Lead credentials early: postgrad diploma, Distinction, GPA 7.125.
- Name the D365 gap honestly, then counter with evidence of fast learning — agentic engineering, self-taught FastAPI, MERN stack.
- One concrete example from GrowFriend: role-based admin panel, ledger-based transactions, cascading delete and escrow refunds.
- Mention SQL and comfort with data, which the ad asks for directly.
- Reframe Aelia Duty Free toward communicating with non-technical stakeholders.
- Close on genuine interest in growing into enterprise applications, matching their stated hiring intent.

### Next steps

- Draft the tailored CV profile and title change.
- Draft the cover letter from the outline above.
- Check the close date and submission method before applying.`,
  },
  {
    id: 'beca',
    company: 'Beca',
    role: '',
    status: 'Not started',
    date: '31 Jul 2026',
    priority: 3,
    jobPostingUrl: '',
    notes: '',
    detail: `### Notes

Nothing captured yet. Add the role title, the posting link, and what the ad asks for.`,
  },
  {
    id: 'westpac',
    company: 'Westpac',
    role: '',
    status: 'Not started',
    date: 'Jul 2026',
    priority: 3,
    jobPostingUrl: '',
    notes: '',
    detail: `### Notes

Nothing captured yet. Add the role title, the posting link, and what the ad asks for.`,
  },
  {
    id: 'komodo-wellbeing',
    company: 'Komodo Wellbeing',
    role: '',
    status: 'Not started',
    date: '4 Aug 2026',
    priority: 3,
    jobPostingUrl: '',
    notes: 'Check whether this is separate from the Orion Health entry.',
    detail: `### Notes

Nothing captured yet.

One thing to resolve: the Orion Health application form used "Komodo" in its video question wording. These may be two separate applications, or Komodo may be the platform running Orion Health's process. Confirm before working on this entry so the two don't get mixed up.`,
  },
];
