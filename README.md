# 18 Before 18

**Practice adulthood before adulthood gets expensive.**

18 Before 18 is a gamified family financial learning platform built around real spending behaviour. Parents deposit real weekly money and set real-life obligations (rent, groceries, power, gas), and the teenager manages what's left. Unpaid bills carry into the next payday, just like real life, and an AI coach turns spending behaviour into useful feedback for both sides.

Core learning loop: **Real money → Real decisions → Consequences → Conversation → Better habits.** The goal isn't to stop bad purchases — it's to help teenagers understand what a spending decision means, what trade-offs it creates, and how to make a better one next time.

It is **not a parental-control app**. It's a handover system: parents create responsibility, teenagers practise managing it, and AI helps both sides learn from what actually happened, framed around conversation over surveillance and practice over punishment.

The full MVP concept has three pages — **Landing Page**, **Parent Dashboard**, **Teen Dashboard** — each with substantially more depth (privacy-aware spending categories, graduated independence levels, savings goals, a what-if simulator, BNPL/family-advance simulation, a practice zone, family habits scoring, etc.) than the current prototype implements. `18_before_18.html` currently ships the **Landing Page** plus a single combined interactive demo standing in for the Parent/Teen dashboards.

## Key features in the current prototype

- **Parent setup panel** — configure weekly deposit, custom household bills (rent, groceries, power, gas), and a savings target.
- **Teen dashboard** — real bank balance vs. "safe to spend" once bills and savings are accounted for, with a live progress bar.
- **Bill payments** — pay bills in any order from the real balance; unpaid amounts carry over and are deducted from the next payday's deposit.
- **AI coach messaging** — contextual feedback for the teen based on spending and payment behaviour.
- **Parent AI briefing** — conversation prompts generated from the teen's weekly activity, not a surveillance feed.
- **Sponsored BNPL ad + warning modal** — a simulated "Buy Now, Pay Later" checkout ad that opens a scroll-gated warning explaining the real cost/risk of "Pay in 4" financing before the teen can continue — an early instance of the concept's "Practice Zone" dark-pattern simulations.
- **Parent/teen account switcher** — toggles between both views within the single demo (the real product runs as two separate logins).
- Fully client-side simulation — no backend; all state lives in memory in the browser and resets on reload.

## MERN scaffold

The prototype is a single static HTML file, but the full concept — separate parent/teen logins, persisted households/bills/goals, an AI coach with real reasoning, and weekly payday automation — needs a real stack. `client/` and `server/` below are scaffolded as a MERN app (MongoDB, Express, React via Vite, Node.js): folders, models, routes, and components exist with working placeholder logic, ready to be filled in feature by feature.

```
.
├── client/                                   # React frontend (Vite)
│   ├── index.html
│   ├── public/                               # favicon.svg, icons.svg
│   └── src/
│       ├── assets/                           # images, icons
│       ├── components/
│       │   ├── common/                       # Button, Modal, Card, ProgressBar, MoneyValue...
│       │   ├── landing/                      # Hero, Stats, HowItWorks, ComparisonTable, FinalCTA
│       │   ├── parent/
│       │   │   ├── WeeklyOverview.jsx        # deposit, bills, savings, safe-to-spend, outstanding
│       │   │   ├── SpendingByCategory.jsx    # privacy-aware view (category, not merchant)
│       │   │   ├── ConversationPrompt.jsx    # AI-generated conversation starters
│       │   │   ├── IndependenceLevels.jsx    # graduated responsibility levels 1-3+
│       │   │   ├── LearningSummary.jsx       # bills-on-time, savings consistency, BNPL encounters
│       │   │   └── HouseholdVisibilitySettings.jsx  # which categories teen can see
│       │   ├── teen/
│       │   │   ├── MyMoneyNow.jsx            # balance, committed bills, savings, safe-to-spend
│       │   │   ├── BillsList.jsx             # due date, paid/unpaid, consequence if missed
│       │   │   ├── SavingsGoals.jsx          # goal creation + projected completion date
│       │   │   ├── WhatIfSimulator.jsx       # simulate a purchase's future impact
│       │   │   ├── BNPLSimulator.jsx         # family-advance / "pay in 4" simulation
│       │   │   ├── PracticeZone.jsx          # BNPL, flash sales, FOMO, subscription upsell scenarios
│       │   │   └── AICoachWidget.jsx         # persistent coach chat/panel
│       │   └── shared/
│       │       ├── WeeklyReport.jsx
│       │       ├── AskAboutReport.jsx        # natural-language Q&A over household data
│       │       └── FamilyHabitsScore.jsx     # behaviour-based score, not wealth-based
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── Login.jsx                     # separate parent / teen login
│       │   ├── Onboarding.jsx                # household + first bills setup
│       │   ├── ParentDashboard.jsx
│       │   └── TeenDashboard.jsx
│       ├── context/                          # AuthContext, HouseholdContext
│       ├── hooks/                            # useSafeToSpend, useWeeklyReport, useAICoach...
│       ├── services/                         # api.js (axios), authService, aiService
│       ├── utils/                            # money formatting, safe-to-spend + carry-over math
│       ├── App.jsx
│       └── main.jsx
│
├── server/                                   # Express/Node backend
│   ├── src/
│   │   ├── models/                           # Mongoose schemas
│   │   │   ├── User.js                       # role: parent | teen
│   │   │   ├── Household.js                  # links parent + teen(s), visibility settings
│   │   │   ├── Bill.js                       # recurring obligation, due date, category
│   │   │   ├── Transaction.js                # spend/payment log, category (not merchant)
│   │   │   ├── SavingsGoal.js
│   │   │   ├── BNPLPlan.js                   # family-advance repayment schedule
│   │   │   ├── WeeklyReport.js
│   │   │   └── HabitsScore.js
│   │   ├── routes/                           # auth.routes.js, household.routes.js, bills.routes.js,
│   │   │                                     # goals.routes.js, simulate.routes.js, ai.routes.js, reports.routes.js
│   │   ├── controllers/                      # one per route group, matching models above
│   │   ├── services/
│   │   │   ├── aiService.js                  # LLM calls: coach messages, conversation prompts, Q&A
│   │   │   ├── safeToSpendService.js         # balance - unpaid bills - savings target
│   │   │   ├── simulationService.js          # what-if + BNPL projection math
│   │   │   └── scoringService.js             # family financial habits score
│   │   ├── middleware/                       # auth (JWT), requireRole(parent|teen), errorHandler
│   │   ├── jobs/                             # weekly payday cron: apply deposit, carry over debt
│   │   ├── config/                           # db.js (Mongo connection), env.js
│   │   └── app.js
│   └── server.js
│
├── docs/
│   └── 18 Before 18 — Product Concept & Feature Map v0.1.md   # Full product spec
├── 18_before_18.html                          # Original single-file interactive prototype
├── package.json                               # root scripts (e.g. concurrently run client + server)
└── README.md
```

### Mapping features → structure

- **Safe-to-spend & carry-over debt** → `safeToSpendService.js` (server) shared by `MyMoneyNow.jsx` / `WeeklyOverview.jsx` and the payday `jobs/` cron.
- **Privacy-aware spending view / household visibility** → `Transaction.category` + `Household.visibilitySettings`, rendered by `SpendingByCategory.jsx`.
- **Graduated independence** → `Household`/`User` independence level field, surfaced in `IndependenceLevels.jsx`.
- **AI coach, conversation prompts, report Q&A** → all routed through `aiService.js` on the server so prompts/context stay server-side.
- **What-if simulator & BNPL simulation** → `simulationService.js`, no real money movement, pure projection.
- **Practice Zone dark-pattern scenarios** (the BNPL ad + warning modal in the prototype is a first instance of this) → `PracticeZone.jsx` component set.
- **Family Habits Score** → `scoringService.js` + `HabitsScore` model, behaviour-based, not wealth-based.
- **Real bank integration** (future, NZ open banking) → would slot into `server/src/services/` as a new `bankService.js` behind the same `Transaction`/`Bill` models.

## Running locally

Prototype only (no backend required):

```
open 18_before_18.html   # macOS
# or just double-click the file / drag it into a browser
```

Full MERN app (scaffolded — see `client/` and `server/`):

```
# 1. copy env templates and fill in real values (MONGO_URI, JWT_SECRET, etc.)
cp server/.env.example server/.env
cp client/.env.example client/.env

# 2. install everything (root, client, server)
npm run install:all

# 3. run client (Vite, :5173) + server (Express, :5000) together
npm run dev

# or separately
npm run dev:server
npm run dev:client
```

The server expects a running MongoDB instance at `MONGO_URI` (defaults to `mongodb://localhost:27017/18-before-18`).
