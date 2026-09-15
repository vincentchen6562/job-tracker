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

## How it works

- **Everything saves automatically** to this browser's localStorage. There is no
  server and nothing leaves your machine.
- Because storage is per-browser, your data won't follow you to another machine
  or survive clearing site data. Use **Download backup** to get a JSON file, and
  **Restore backup** to load it somewhere else.
- **Download markdown** regenerates the tracker as a markdown document — the
  summary table plus one section per application.
- **Reset to seed data** wipes your saved data and returns to the applications
  in `client/src/data/seedData.js`.

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
│   └── seedData.js            starting applications and status options
└── utils/
    ├── date.js                parses loose dates like "3 Aug 2026"
    ├── storage.js             localStorage read/write
    └── exportData.js          markdown and JSON export
```

## Changing the starting data

`client/src/data/seedData.js` holds the applications loaded on first run, and
`STATUS_OPTIONS` in `shared/src/statuses.js` defines the dropdown values. If you add or rename a status,
also add a matching `--status-*` colour variable and `.status--*` rule in
`styles.css` — the slug is the lowercased name with spaces replaced by hyphens,
so "In progress" becomes `.status--in-progress`.
