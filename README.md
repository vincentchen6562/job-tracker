# Application tracker

A small React app for tracking graduate job applications. Table on top for
scanning and sorting, one card per application underneath for the full notes.

## Running it

You need Node 18 or newer.

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173).

To produce a static build you can host anywhere:

```bash
npm run build     # output lands in dist/
npm run preview   # serve that build locally
```

## How it works

- **Everything saves automatically** to this browser's localStorage. There is no
  server and nothing leaves your machine.
- Because storage is per-browser, your data won't follow you to another machine
  or survive clearing site data. Use **Download backup** to get a JSON file, and
  **Restore backup** to load it somewhere else.
- **Download markdown** regenerates the tracker as a markdown document — the
  summary table plus one section per application.
- **Reset to seed data** wipes your saved data and returns to the applications
  in `src/data/seedData.js`.

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

`src/data/seedData.js` holds the applications loaded on first run, and
`STATUS_OPTIONS` defines the dropdown values. If you add or rename a status,
also add a matching `--status-*` colour variable and `.status--*` rule in
`styles.css` — the slug is the lowercased name with spaces replaced by hyphens,
so "In progress" becomes `.status--in-progress`.
