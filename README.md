# Application tracker

A small React app for tracking graduate job applications. Table on top for
scanning and sorting, one card per application underneath for the full notes.

## Public link

**https://vincentchen6562.github.io/job-tracker/** is the link to share, on CVs
and the portfolio. It's the front door page in `frontdoor/`, published to GitHub
Pages by `.github/workflows/frontdoor.yml`. The tracker runs on a Render free web
service that sleeps when idle (ADR-0010), so the front door shows "Waking the
server…", polls `/api/health`, and opens the tracker at
https://job-tracker-uhda.onrender.com/ once it answers. If the host ever
changes, update `TRACKER_URL` in `frontdoor/index.html` and the link stays the
same.

## Running it

You need Node 22.12 or newer, and a MongoDB database for the server.

```bash
npm install
cp server/.env.example server/.env   # then fill in MONGODB_URI and SESSION_SECRET
npm run dev
```

`npm run dev` starts both the Vite dev server and the Express server. Open the
URL Vite prints (usually http://localhost:5173); it forwards `/api` to Express.

```bash
npm test          # server tests, against an in-memory MongoDB
npm start         # the server alone; with NODE_ENV=production it also serves client/dist/
```

To build the client, which the server serves in production:

```bash
npm run build     # output lands in client/dist/
npm run preview   # serve that build locally with Vite
```

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

## How it works

- **You need an account.** Everything saves to it as you type, so the tracker
  is the same on every device you log in on.
- **Try the demo** gives a visitor a temporary account of their own, already
  holding the seed data, with no sign-up (ADR-0005). It and its applications
  are deleted 24 hours later by a MongoDB TTL index. Signing up from a demo
  starts a new, empty account: the demo's applications don't carry over.
- Use **Download backup** to get a JSON file of every application, and
  **Restore backup** to replace an account's applications with one.
- **Download markdown** regenerates the tracker as a markdown document — the
  summary table plus one section per application.
- **Reset to seed data** puts a demo back to the applications it started with.
  It's offered only in demo accounts; a real account's applications are its
  own, and restoring a backup is how it replaces them.

## Editing

- Table cells are directly editable. Company, role, date, and job posting link
  are text fields; status is a dropdown; priority is a 0–5 star rating (click the
  same star again to clear it).
- Sort by company, status, priority, or date using the column headers. Undated
  applications always sort to the bottom rather than pretending to be old.
- Each card has **Edit notes**, which swaps the rendered notes for a markdown
  editor. Headings, lists, tables, links, and code all render.
- The **↓** button in a table row scrolls to that application's card.
- The moon/sun button toggles dark mode; the choice is remembered.

## Structure

```
src/
├── App.jsx                    state, sorting, persistence, layout
├── main.jsx                   entry point
├── styles.css                 all styling, both themes
├── components/
│   ├── TrackerTable.jsx       sortable editable table
│   ├── ApplicationCard.jsx    per-application card with markdown
│   ├── StarRating.jsx         priority stars
│   └── Toolbar.jsx            add, export, import, reset, theme
├── data/
│   └── taxonomy.js            facet inference rules
└── utils/
    ├── date.js                parses loose dates like "3 Aug 2026"
    ├── storage.js             localStorage read/write
    └── exportData.js          markdown and JSON export
```

## Changing the starting data

`server/src/seedData.js` holds the applications a demo account starts with, and
`STATUS_OPTIONS` in `shared/src/statuses.js` defines the dropdown values. If you add or rename a status,
also add a matching `--status-*` colour variable and `.status--*` rule in
`styles.css` — the slug is the lowercased name with spaces replaced by hyphens,
so "In progress" becomes `.status--in-progress`.
