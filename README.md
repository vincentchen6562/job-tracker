# Application tracker

A tracker for a graduate job search: one place to record every job applied for
and where each one stands. It's a MERN app — React and Vite in the browser,
Express and MongoDB behind it — with hand-built accounts, so the same tracker
appears on every device you log in to.

Applications live in a table you can edit in place, or a grid of cards, with
search, facet filters, sorting and paging over the whole account. Edits save
themselves a moment after you stop typing.

Two documents carry the background this one doesn't repeat:

- **[CONTEXT.md](CONTEXT.md)** — the vocabulary. *Application*, *Status*,
  *Facet*, *Demo account*, *Backup*, *Seed data* and the rest are defined
  there, with the words to avoid.
- **[docs/adr/](docs/adr/)** — the decisions, and the options that were
  rejected. Anything below that looks arbitrary usually has an ADR behind it.

[CODEBASE.md](CODEBASE.md) is the code walkthrough, for changing the thing
rather than running it.

## Public link

**https://vincentchen6562.github.io/job-tracker/** is the link to share, on CVs
and the portfolio. It's the front door page in `frontdoor/`, published to GitHub
Pages by `.github/workflows/frontdoor.yml`. The tracker runs on a Render free web
service that sleeps when idle (ADR-0010), so the front door shows "Waking the
server…", polls `/api/health`, and opens the tracker at
https://job-tracker-uhda.onrender.com/ once it answers. If the host ever
changes, update `TRACKER_URL` in `frontdoor/index.html` and the link stays the
same.

## How it works

- **You need an account.** Sign up with an email and a password of 10–128
  characters — no composition rules, so a passphrase or a password manager just
  works (ADR-0002). Everything saves to the account as you type, so the tracker
  is the same on every device you log in on. You stay logged in for 30 days,
  extended while you keep using it.
- **Try the demo** gives a visitor a temporary account of their own, already
  holding the seed data, with no sign-up (ADR-0005). It and its applications are
  deleted 24 hours later by a MongoDB TTL index. Signing up from a demo starts a
  new, empty account: the demo's applications don't carry over, so download a
  backup first if you want them.
- **Nothing is stored in the browser** except your theme and whether you last
  used the table or the cards. Applications are the server's.
- **There's no forgot-password flow yet** (ADR-0002). An admin script covers a
  lockout — see below.

## Using it

- **The table** is editable in place. Company, role, date and job posting link
  are text fields; status is a dropdown; priority is a 0–5 star rating (click
  the same star again to clear it). **→** opens an application's detail page and
  **✕** removes it, after a confirmation.
- **The cards view** is read-only at a glance — open a card to edit it. The
  button in the toolbar switches between the two, and each device remembers
  which you chose.
- **The detail page** is where the markdown **Details** live. **Edit details**
  swaps the rendered markdown for an editor; headings, lists, tables, links and
  code all render. The one-line **Summary**, the facets and everything else on
  the application are editable here too.
- **Search and filters** work over the whole account, in the browser
  (ADR-0006), so they're instant. Search needs every word to appear somewhere,
  so `auckland grad` narrows rather than widens.
- **Category, Role type and Location** are guessed from the role, summary and
  details when you haven't set them — shown as "Auto" with a dashed chip. Set
  one by hand and your choice wins.
- **Sorting** by company, status, priority or date uses the column headers.
  Undated applications always sort to the bottom rather than pretending to be
  old, and statuses sort in pipeline order, not alphabetically.
- **The save indicator** by your email shows Saving… / Saved / Couldn't save,
  with a Retry. If a save is still pending the browser warns you before you
  close the tab, and if your session ends you get a log-in box over the page
  rather than losing the edit.
- **The account page** (`#/account`) is where you change your password or
  delete your account. Changing it logs out every other device but keeps this
  one. A demo account sees a sign-up prompt there instead.
- **The moon/sun button** toggles dark mode; the choice is remembered per
  device.

## Moving data in and out

- **Download backup** writes a JSON file of every application in the account.
  It's the copy you control — worth taking before you delete your account, and
  the only way to carry a demo's applications into a real one.
- **Restore backup** replaces every application in the account with the ones in
  a file, after a confirmation that says so. It's how an earlier tracker's data
  moves in. The restore runs in a single transaction, so a file that fails
  partway leaves the account exactly as it was.
- **Older backups still work.** The server reads the original bare-array
  format, the version with attachments, and the current one, converting as it
  goes: the old one-line `notes` becomes **Summary**, the old markdown `detail`
  becomes **Details** (ADR-0011), and attachment data is dropped (ADR-0009).
- **Download markdown** regenerates the tracker as a readable document — the
  summary table plus one section per application. It exports what you're
  currently looking at, so filters apply. It can't be restored; use a backup
  for that.
- **Reset to seed data** puts a demo back to the applications it started with.
  It's offered only in demo accounts; a real account's applications are its own,
  and restoring a backup is how it replaces them.

## Running it locally

You need **Node 22.12 or newer** and a MongoDB database for the server.

```bash
npm install
cp server/.env.example server/.env   # then fill it in, see below
npm run dev
```

`npm run dev` starts the Vite dev server and the Express server together. Open
the URL Vite prints (usually http://localhost:5173); it forwards `/api` to
Express on port 3000, so the browser sees one origin in development just as it
does in production (ADR-0004).

### Environment variables

`server/.env.example` documents all of them. The server reads `server/.env` when
it starts and **refuses to start** without the two required ones, so a bad
deploy fails loudly instead of running insecurely.

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | Connection string, including the database name |
| `SESSION_SECRET` | yes | A long random string; use a different one in production |
| `NODE_ENV` | no | `development` or `production`; only production serves the built client |
| `PORT` | no | Defaults to 3000 — keep it there in development, since Vite forwards to that port |
| `RATE_LIMIT_*` | no | Per-IP limits for auth, the API and demo creation; the defaults are in the example file |

A secret you can paste:

```bash
node -e "console.log(crypto.randomBytes(32).toString('hex'))"
```

### The development database

**Development uses its own Atlas database and its own database user**, separate
from production, so an experiment can't damage the real tracker. It's a
different database on the same free cluster — the example connection string ends
`/job-tracker-dev`, where production's ends `/job-tracker`. URL-encode any
special characters in the password.

The database has to be a **replica set** for restore's transaction to run.
Atlas is one by default; a plain local `mongod` is not. To confirm a database
can do it:

```bash
npm run check:transactions --workspace server
```

### Root commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite and Express together |
| `npm test` | The server test suite |
| `npm run build` | Builds the client to `client/dist/` |
| `npm run preview` | Serves that build locally with Vite |
| `npm start` | The server alone; with `NODE_ENV=production` it also serves `client/dist/` |

## Tests and CI

```bash
npm test
```

115 tests across 12 files, run by Vitest. They drive the real Express app over
HTTP with Supertest, against an in-memory MongoDB started as a replica set, so
restore's transaction really runs. Each test file gets its own database. Nothing
external is needed — no running MongoDB, no network — though the first run
downloads the in-memory server's binary.

The suite covers sign-up and login, sessions, ownership between accounts, the
application writes and their validation, restore of every backup version, demo
accounts and their expiry, and the rate limits and other protections. The client
is checked by hand in the browser, which is the project's practice for UI.

**CI** (`.github/workflows/ci.yml`) runs `npm ci`, `npm test` and
`npm run build` on every push and pull request, so a change that breaks login or
leaks data between accounts is caught before it deploys. It caches the in-memory
MongoDB binary outside `node_modules`, where `npm ci` can't delete it.

## Deploying

The server serves the API and the built client from one origin (ADR-0004), so
there's one service to deploy. There's no committed hosting config — the Render
service is set up in its dashboard — but what it needs is:

- **Build**: install dependencies and run `npm run build`, so `client/dist/`
  exists.
- **Start**: `npm start`.
- **Environment**: `MONGODB_URI` pointing at the production database,
  a `SESSION_SECRET` that isn't development's, and `NODE_ENV=production` —
  without which the server won't serve the client build, and cookies won't be
  `Secure`.

Things to know about the free tiers (ADR-0010):

- **Render sleeps** after 15 minutes without requests and takes about a minute
  to wake. That's what the front door page exists to cover. Keeping it awake by
  pinging was rejected: it would use 744 of the 750 free hours a month.
- **Render suspends** a free service for the rest of the month if usage goes
  over the allowance, so keep only this one service on the account.
- **Atlas network access must be `0.0.0.0/0`.** Free hosts have no fixed
  outbound IP, so there's no narrower rule to write. A strong database password
  is what protects the cluster instead.
- **The free Atlas tier has no automated backups.** Download backup is the only
  copy anyone holds of an account.

## Resetting a password

There's no forgot-password flow yet (ADR-0002). To let someone back in to a
locked-out account, run the admin script with the account's email. It gives the
account a random new password, logs it out everywhere, and prints the password
to pass on. They can change it on the account page once they've logged in.

```bash
npm run reset-password --workspace server -- someone@example.com
```

It acts on the database in `MONGODB_URI`, read from `server/.env` unless it's
already set in the environment. To reset a production account, set production's
connection string in the environment for that one command.

## Upgrading a database made before demo accounts

A demo account has no email, so the unique index on `email` has to allow
accounts without one. A database created before demo accounts existed has the
old index, which treats every demo as the same missing value: the first demo
works, and every later one fails with a duplicate key error until that first
one expires, so "Try the demo" looks intermittently broken.

MongoDB won't redefine an index that already exists under the same name, so
the old one has to be dropped by hand. Indexes are only built when the server
starts, so it needs restarting afterwards to get the replacement. Nothing
keeps emails unique in between, so keep the gap short.

This isn't a change to the code: it's one command against each database that
predates demo accounts. Locally, run it from `server/`, where it reads the
connection string the same way the server does:

```bash
mongosh "$(grep '^MONGODB_URI=' .env | cut -d= -f2-)" --eval "db.accounts.dropIndex('email_1')"
```

then restart `npm run dev`.

In production the database is the one named in Render's `MONGODB_URI`, not
`job-tracker-dev`. Drop the index from the Atlas UI — Browse Collections, that
database, the `accounts` collection, the Indexes tab — and then deploy. In
that order the deploy's own restart builds the replacement; deploy first and
the new code meets the same conflict, leaving the old index in place until you
drop it and restart again.

To check, run the same command with `getIndexes()`: `email_1` should be back
as `unique: true, sparse: true`. An "index not found" error means that
database never had the old index and there's nothing to do.

New databases need nothing: the index is created correctly the first time.

## Project layout

Three npm workspaces, driven from the root `package.json`.

```
client/                 the React app (Vite)
├── index.html
└── src/
    ├── main.jsx            entry point
    ├── AuthGate.jsx        logged in? → the tracker. Logged out? → the login screen.
    ├── App.jsx             all tracker state
    ├── components/         table, cards, toolbar, filters, auth forms, save indicator
    ├── pages/              login and sign-up, account, application detail
    ├── hooks/              the hash router, and the applications sync
    ├── data/taxonomy.js    facet inference rules
    ├── utils/              API client, date parsing, export, device preferences
    └── styles.css          all styling, both themes

server/                 the Express API, which also serves the client build
├── src/
│   ├── app.js             the app factory
│   ├── config.js          environment variables, and refusing to start without them
│   ├── auth.js            sign-up, login, logout, demo, password, delete
│   ├── accounts.js        the Account model
│   ├── applications.js    the Application model and its routes
│   ├── restore.js         backups in, every version
│   ├── demo.js            demo accounts and reset to seed data
│   ├── sessions.js        MongoDB-backed sessions
│   ├── seedData.js        what a demo account starts with
│   └── protections.js     JSON-only writes, and rate limits
├── scripts/               admin CLI
└── test/                  the API test suite

shared/src/             the status list, an application's fields, the password rule
frontdoor/              the permanent public link (GitHub Pages)
docs/adr/               the decision records
```

## Changing the starting data

`server/src/seedData.js` holds the applications a demo account starts with.

`STATUS_OPTIONS` in `shared/src/statuses.js` defines the statuses, in pipeline
order — which is also their sort order and the server's validation list. If you
add or rename one, add a matching `--status-*` colour variable to **both**
`:root` blocks and a `.status--*` rule in `client/src/styles.css`. The slug is
the lowercased name with spaces replaced by hyphens, so "In progress" becomes
`.status--in-progress`.

An application's fields are defined once, in `applicationDefaults()` in
`shared/src/application.js`. The server derives its schema, validation and
responses from that, so adding a field there is most of the work.

## The decisions

The ADRs in [docs/adr/](docs/adr/) record why this is built the way it is:

| | |
|---|---|
| [0001](docs/adr/0001-mern-backend-as-a-portfolio-project-on-free-tiers.md) | A MERN backend as a portfolio project, on free tiers |
| [0002](docs/adr/0002-hand-built-email-and-password-auth.md) | Hand-built email and password auth |
| [0003](docs/adr/0003-server-side-sessions-over-jwt.md) | Server-side sessions over JWT |
| [0004](docs/adr/0004-single-origin-deployment.md) | Single-origin deployment |
| [0005](docs/adr/0005-login-required-with-temporary-demo-accounts.md) | Login required, with temporary demo accounts |
| [0006](docs/adr/0006-browser-owns-search-filter-sort-and-inference.md) | The browser owns search, filter, sort and inference |
| [0007](docs/adr/0007-browser-generated-application-ids.md) | Browser-generated application ids |
| [0008](docs/adr/0008-autosave-with-field-level-patches.md) | Autosave with field-level patches |
| [0009](docs/adr/0009-remove-cv-and-cover-letter-attachments.md) | Remove CV and cover letter attachments |
| [0010](docs/adr/0010-host-on-render-free-tier.md) | Host on Render's free tier |
| [0011](docs/adr/0011-rename-notes-and-detail-to-summary-and-details.md) | Rename notes and detail to Summary and Details |
