# Job Application Tracker — Codebase Walkthrough

A reading guide to the app as it stands at commit `a8303b3`. Written to be read
alongside the source, top to bottom, so you can get your hands back on the code.

---

## 1. The thirty-second version

A single-page React app, no server, no router library, no CSS framework, no
tests. Every application you track lives in one array in React state; that array
is mirrored into `localStorage` on every change. Two "pages" (a list and a
detail view) are switched by reading `window.location.hash`.

- **~1,600 lines of JS/JSX**, **~1,300 lines of CSS**, 4 runtime dependencies.
- **Build**: Vite. `npm run dev` for the dev server, `npm run build` → `dist/`.
- **`base: './'`** in `vite.config.js` means the built app works from a file://
  path or any sub-directory. That choice is also *why* routing is hash-based.
- **Fonts** are the only network request: Space Grotesk (display), Inter (body),
  IBM Plex Mono (dates, URLs, status pills), pulled from Google Fonts in
  `index.html`.

```
index.html          root div + font links + module script
  src/main.jsx      ReactDOM.createRoot → <App /> in StrictMode
    src/App.jsx     ALL state lives here
      components/   presentational, state comes down as props
      pages/        the detail route
      data/         seed applications + the facet taxonomy
      utils/        date parsing, localStorage, export
      hooks/        the hash router
```

---

## 2. The data model

One application is a plain object. `blankApplication()` in `App.jsx:42` is the
canonical definition:

| Field | Type | Notes |
|---|---|---|
| `id` | string | `app-<timestamp>-<random>`; seed rows use readable ids like `'serato'` |
| `company` | string | |
| `role` | string | |
| `status` | string | must be one of `STATUS_OPTIONS` |
| `date` | string | **free text**, not a Date — `"3 Aug 2026"`, `"Jul 2026"`, `""` |
| `priority` | number | 0–5, 0 meaning unrated |
| `jobPostingUrl` | string | |
| `notes` | string | one-line summary, shown on the card |
| `detail` | string | markdown, shown on the detail page |
| `category` | string | `''` means "infer it" |
| `roleType` | string | `''` means "infer it" |
| `locations` | string[] | `[]` means "infer it" |

Two things to notice. First, `date` being a string is deliberate — the tracker
came from a markdown document with loose dates, and `utils/date.js` exists
purely to sort those strings. Second, the last three fields use *empty as a
sentinel* for "let the classifier decide", which is the whole reason
`data/taxonomy.js` exists.

---

## 3. `src/App.jsx` — the only stateful component

475 lines, and everything else in the app is downstream of it. Read it in five
passes.

### 3.1 The state

```js
applications   // the array of records — the actual data
sort           // { key, direction }
query          // the search box
filters        // { category, roleType, location, priority }, 'all' = off
view           // 'table' | 'cards'
page           // 1-based page number
focusId        // "scroll to this row/card once it exists"
pendingId      // "this row is being filled in — hold it out of the sort"
theme          // 'light' | 'dark'
message        // the transient flash line
saveFailed     // sticky warning when localStorage refused a write
cardRefs       // useRef map of id → DOM node, for scrollIntoView
```

Three of these are lazily initialised from storage — `useState(() => loadX())`.
The arrow function matters: without it you'd hit `localStorage` on every render
instead of once.

### 3.2 The effects (`App.jsx:103–125`)

Each one is a one-way sync out of state:

- **Persist applications** — `setSaveFailed(!saveApplications(applications))`.
  Neat trick: the save function returns a boolean, so the persistence effect and
  the error banner are the same line.
- **Theme** — writes `document.documentElement.dataset.theme`, which is what the
  `:root[data-theme='dark']` block in the CSS keys off, then saves it.
- **View** — saves `'table'`/`'cards'`.
- **Reset page on narrowing** — `setPage(1)` whenever `query` or `filters`
  change, so filtering never leaves you on a now-empty page 4.
- **Auto-dismiss the flash** after 3.5 s, with the `clearTimeout` cleanup that
  prevents an old timer from clearing a *newer* message.

### 3.3 The derivation pipeline (`App.jsx:127–221`)

This is the heart of the file. Data flows in one direction through six steps:

```
applications
  └─ facetsById   Map<id, facets>   memo on [applications]
  └─ counts       tally per facet   memo on [applications, facetsById]
  └─ filtered     drop pendingId, apply filters + search
  └─ sorted       apply sort spec
  └─ ordered      re-append the pending row at the very end
  └─ visible      slice to the current page
```

**`facetsById`** builds the Map once per change to `applications` rather than
calling `resolveFacets` inside the filter predicate, where it would re-run per
row per keystroke.

**`counts`** feeds the numbers in the filter dropdowns (`Category (3)`). Note
that it tallies over *all* applications, not the filtered set — so the numbers
don't shift under you while you're choosing.

**`matchesFilters`** (`App.jsx:153`) is a `useCallback` because `filtered`
depends on it; without the memo it'd be a new function every render and the
`useMemo` below it would never hit. Each facet is an early `return false`, then
the free-text search runs last.

**`matchesQuery`** (`App.jsx:62`) is worth reading closely. It joins every
searchable field into one lowercased haystack and requires that **every** token
appear: `tokens.every(t => haystack.includes(t))`. That's an AND, so typing
`auckland grad` narrows instead of widening. Facet values are in the haystack
too, so you can search for an *inferred* category you never typed.

**`sorted`** copies before sorting (`[...filtered]`) because `Array.sort`
mutates, and mutating a memo's input would be a bug waiting to happen. The
comparator branches per key:
- `date` → `parseTrackerDate` both sides, and **null always sinks**, regardless
  of direction (`if (at === null) return 1`). Undated entries don't pretend to be
  ancient.
- `priority` → numeric, `Number(x) || 0`.
- `status` → looks up `STATUS_ORDER`, the index map built at `App.jsx:23` from
  `STATUS_OPTIONS`. So statuses sort in *pipeline order*, not alphabetically,
  and adding a status to that array automatically slots it in. Unknown → 99.
- anything else → `localeCompare`.

**Paging** (`App.jsx:213–221`): `PAGE_SIZE` is `{ table: 10, cards: 6 }` because
cards are taller. `safePage = Math.min(page, pageCount)` clamps on *read* rather
than trying to correct the `page` state — simpler, and it means deleting the
last item on page 5 just shows you page 4 without an extra render. `fillerCards`
pads a short last page with invisible rows/tiles so the pagination bar doesn't
jump up the screen when you land on it.

### 3.4 The "pending row" dance

This is the subtlest thing in the codebase, and it's what commit `a8303b3`
fixed. The problem: you click **Add application**, get a blank row, and start
typing a company name — if that row were in the sort, it would leap around the
table after every keystroke, and if it were subject to the filters it would
vanish entirely the moment it failed to match.

The solution, in three parts:

1. `addApplication()` prepends the record to `applications` **and** sets
   `pendingId`. `filtered` explicitly excludes that id, and `ordered` re-appends
   it at the very end — so it's parked on the last page, immovable.
2. `focusId` triggers the effect at `App.jsx:225`, which finds the record's index
   in `ordered`, jumps to the page containing it, then after an 80 ms beat calls
   `scrollIntoView` on the registered ref. The delay lets React commit the page
   change before the scroll targets a node that now exists.
3. Ending the edit differs by view:
   - **Table**: `TrackerTable` puts an `onBlur` on the pending `<tr>` and checks
     `event.currentTarget.contains(event.relatedTarget)` — focus moving *within*
     the row's fields doesn't count; focus leaving the row does, and calls
     `commitPending()`.
   - **Cards**: there's no inline editing, so the signal is *navigation*. The
     effect at `App.jsx:254` uses a `useRef` flag to remember "we visited this
     record's detail page", and clears `pendingId` when the route later moves
     away from it.

`commitPending()` also does a courtesy check: if the freshly-typed record
doesn't match the active filters, it tells you rather than letting the row
silently disappear.

`pendingId` is deliberately **not** persisted — a reload releases the row into
the normal sort.

### 3.5 The actions

- `updateApplication(id, patch)` — the single write path. Every editable control
  in the app calls this with a one-key patch. Immutable map, no mutation.
- `removeApplication(id)` — `window.confirm`, filter out, clear pending if it
  was the pending one, and navigate home if you were on its detail page.
- `addApplication`, `clearFilters`, `resetToSeed` — as named.
- `exportMarkdown` exports `ordered`, i.e. **what you're currently looking at**,
  and the flash line says so when filters are on. `exportJson` exports
  `applications` — the whole thing, because it's a backup.
- `importJson(raw)` — parses, requires an array, then spreads each item over
  `blankApplication()`. That spread is the migration story: an old backup missing
  `locations` or `roleType` picks up the defaults instead of producing
  `undefined`s downstream.

### 3.6 The render

`saveFailed` renders a persistent warning with its own **Download backup**
button — the reasoning being that if storage is broken, the open tab is the only
copy. Toolbar and FilterBar are hidden on the detail route. Then a ternary picks
table / cards / detail, and `Pagination` renders under the list (and returns
`null` itself when there's only one page).

---

## 4. `src/data/taxonomy.js` — the classifier

191 lines, no dependencies, pure functions. The premise: the seed data and
anything already in `localStorage` predate the category/roleType/location
fields, so rather than asking you to backfill 30 records, the app **guesses**
from text you already wrote.

Three rule tables, each an array of `[label, regex]` pairs, **ordered most
specific first** — `firstMatch` returns on the first hit. That ordering is
load-bearing: `Quality engineering` is tested before `Software development` so
"Test Automation Engineer" doesn't get swallowed by the `engineer` in the
software rule.

The three public derivers each have a wrinkle:

- **`deriveCategory`** tries the **role title alone** first, and only falls back
  to `role + notes + detail` if that misses. A cover letter mentioning "worked
  with the data team" shouldn't reclassify a developer role.
- **`deriveRoleType`** special-cases the bare word `grad`/`graduate` **in the
  title only** (`"…(2026 Grad Programme)"`), because in body text "welcomes
  recent graduates" is noise. Outside the title, the rule demands
  graduate + programme/scheme/role/pathway.
- **`deriveLocations`** returns **all** matches rather than the first, since an
  ad can say "Auckland or Christchurch". The regexes are city names only — the
  comment explains why: "University of Canterbury" in a cover letter must not
  tag a job as Christchurch. Te reo names are included (`tāmaki makaurau`,
  `ōtautahi`) and `Remote` requires an emphatic phrase ("fully remote",
  "100% remote") rather than the bare word.

**`explicitLocations`** is a small compatibility shim: prefers the `locations`
array, falls back to an older singular `location` string.

**`resolveFacets`** is the one everything else calls. It returns the resolved
value *plus* an `IsAuto` flag for each facet, which is how the UI can show
inferred chips with a dashed border and a tooltip saying so.

---

## 5. `src/components/`

### `TrackerTable.jsx` (204 lines)
A `COLUMNS` array drives the header; `sortable: false` on Role and Job posting
renders plain text instead of a sort button. `handleSort` toggles direction when
you click the active column and resets to `asc` otherwise. `SortArrow` shows a
neutral `↕` on idle columns, so every sortable header advertises itself.

Every cell is a **controlled input** wired straight to `onUpdate`. There's no
local draft state and no debounce — each keystroke goes to `App` state and
therefore to `localStorage`. Fine at this scale; the first thing to revisit if
the list ever gets large.

The status `<select>` computes its own class from the value:
`` `status--${app.status.toLowerCase().replace(/\s+/g, '-')}` ``. That's the
slug convention the README documents.

The two refs, `pendingInput` and `focusedFor`, implement autofocus-once: focus
the new row's company field, but only the first time it appears, so re-renders
don't yank the cursor back.

### `ApplicationSummaryCard.jsx` (109 lines)
Read-only by design — the whole card body is one `<a>` to the detail route, with
the footer's own links/buttons outside it so they don't nest inside an anchor.
`chips` flattens the three facets into one list and drops `Unspecified` values.
The CSS reserves two lines each for the role and the notes, and always renders
the `<ul class="chips">` even when empty, so cards in a grid line up regardless
of how much each one has.

### `FilterBar.jsx` (148 lines)
`FacetSelect` is a tiny shared select that appends the count to each label.
`usable()` is the good bit: it hides options with a count of zero **except** the
currently selected one — so the dropdown stays short without ever silently
dropping the thing you filtered by. Location options are assembled from the
premade list *plus* any free-text city someone typed into a tag box, sorted,
with `Unspecified` pinned last.

### `Pagination.jsx` (81 lines)
`pageList(current, pageCount)` returns the strip. Under 8 pages, all of them;
past that, a `Set` of `[1, 2, current±1, last-1, last]` is filtered to range,
sorted, and gaps larger than 1 become an ellipsis token. Returns `null` when
there's one page — the component decides its own visibility instead of the
parent guarding the call site.

### `StarRating.jsx` (34 lines)
`const shown = hover || value` — hover preview falls back to the real value, and
`0` being falsy makes "no hover" work without a null check. `onClick` toggles:
clicking the star you're already on clears the rating to 0. It's a
`role="radiogroup"` of `role="radio"` buttons, with `onFocus`/`onBlur` mirroring
the mouse handlers so keyboard users see the same preview.

### `TagInput.jsx` (110 lines)
Free-text tags for locations. Enter or `,` commits; Backspace on an empty box
removes the last tag; **blur also commits**, so a half-typed tag is never lost.
`add()` splits on commas (handles pasting "Auckland, Wellington" and datalist
picks), dedupes case-insensitively, and only calls `onChange` if something
actually changed. The `onMouseDown` on the wrapper focuses the input when you
click the padding — but checks `event.target === event.currentTarget` first so
it doesn't steal the remove buttons' clicks.

### `Toolbar.jsx` (57 lines)
Add / view toggle on the left; markdown, backup, restore, reset on the right.
Restore is a hidden `<input type="file">` triggered by a styled button, read via
`FileReader`, with `event.target.value = ''` afterwards so re-picking the same
file fires `change` again.

### `ViewToggle.jsx` (46 lines)
Two buttons with inline SVG icons and `aria-pressed`, visually-hidden labels for
screen readers.

---

## 6. `src/pages/ApplicationDetailPage.jsx` (228 lines)

The detail route. Handles the missing-record case first (you can bookmark a hash
for something you later deleted) before touching `application`.

Unlike the card, **everything here is editable**: company and role are bare
inputs styled as headings, and status, priority, date, job posting and the
one-line summary are all controlled fields calling `onUpdate`.

`FacetField` is the explicit/auto switch. Its first `<option>` has `value=""`
and reads `Auto — Software development`, showing what the classifier *would*
say; picking it writes `''`, handing control back to the inference. Location
uses `TagInput` instead, with the inferred cities shown as the placeholder.

The markdown notes have a single `editing` boolean: a `<textarea>` bound to
`app.detail`, or `ReactMarkdown` with `remarkGfm` (tables, strikethrough,
task lists — the seed data uses tables heavily). The `useEffect` at the top sets
`document.title` to the company name.

---

## 7. `src/utils/`

### `date.js` (40 lines)
`parseTrackerDate` returns a timestamp or `null`. Tries in order: empty/`—`/`-`
→ null; ISO `2026-08-03`; `3 Aug 2026` (month matched on its first three
letters, so "July" and "Jul" both work); `Aug 2026` → the 1st of the month, so a
month-only entry sorts ahead of dated ones in that month; then `Date.parse` as a
last resort. Uses `Date.UTC` throughout, so a date never shifts by a day
depending on your timezone.

### `storage.js` (67 lines)
Three keys, all namespaced `vc-application-tracker/…`, and every function
wrapped in try/catch — private-mode browsers throw on `setItem`. `loadApplications`
validates that the parsed value is an array before trusting it; `loadView`
validates against the two legal strings. `saveApplications` **returns a boolean**,
which is what drives the warning banner; the theme and view savers swallow
failures silently, because losing a theme preference isn't worth a banner.

### `exportData.js` (90 lines)
`toMarkdown` rebuilds the original notes document: an H1, a summary table, then
`---`-separated sections per application. `cell()` escapes pipes and flattens
newlines so a note can't break the table; `stars()` renders `★★★★☆`; `slug()`
builds the anchor that "Jump to section" links to. Each section's metadata block
uses `resolveFacets`, so **inferred** categories and locations make it into the
export even though they were never typed. `downloadFile` is the standard
Blob → object URL → synthetic `<a>` click → revoke dance.

---

## 8. `src/hooks/useHashRoute.js` (26 lines)

The entire router. `parseHash` strips the leading `#`, matches `/app/:id`, and
returns `{ name: 'detail', id }` or `{ name: 'home' }`. The hook subscribes to
`hashchange` and returns the current route. Navigation is just `<a href="#/app/…">`
— no click handlers, no history library, and the back button works for free.
Hash routing (rather than the History API) is what lets the built `dist/` open
from a file path or a GitHub Pages sub-directory without server rewrites.

---

## 9. `src/styles.css` (1,295 lines)

Hand-written, no framework. Structured as:

1. **Tokens** on `:root` — surfaces, ink, lines, accent, six `--status-*`
   colours, radius, shadow, three font stacks.
2. **`:root[data-theme='dark']`** redefines the same names. Nothing else in the
   file is theme-aware, which is why dark mode is one `dataset.theme` assignment
   in `App.jsx`.
3. Section by section, in roughly the order of the page: masthead, toolbar, view
   toggle, pagination, flash, table, status, stars, cards, summary cards, filter
   bar, chips, detail page, tag input, markdown.
4. `@media (max-width: 720px)` for the phone layout, and
   `@media (prefers-reduced-motion: reduce)` killing transitions and smooth
   scroll.

Status colours work by setting `color` on the element and letting `border:
1px solid currentColor` and `background: currentColor` (on the card spine) pick
it up — one variable per status drives the pill, the select and the stripe.

---

## 10. Things worth knowing before you change anything

- **Adding a status** means three places, not one: `STATUS_OPTIONS` in
  `seedData.js`, a `--status-<slug>` variable in *both* `:root` blocks, and a
  `.status--<slug>` rule. The slug is lowercase with spaces → hyphens. Position
  in `STATUS_OPTIONS` also sets its sort order, via `STATUS_ORDER`.
- **`'Refused'` is currently missing its CSS.** It was added to `STATUS_OPTIONS`
  in commit `398c624` but there's no `--status-refused` variable and no
  `.status--refused` rule, so it falls through to the default grey and looks
  identical to "Not started" in the pill, the select and the card spine.
- **The README is stale.** Its structure diagram lists
  `components/ApplicationCard.jsx`, which was split into
  `components/ApplicationSummaryCard.jsx` and `pages/ApplicationDetailPage.jsx`.
  It also predates the filter bar, pagination, view toggle, taxonomy and tag
  input.
- **Every keystroke writes to `localStorage`.** Not a problem at six
  applications; the fix if it ever is would be debouncing the persist effect, not
  adding local input state.
- **`facetsById` recomputes on every `applications` change**, which means every
  keystroke re-runs the regexes over all records. Same story: fine now, and the
  Map is already the mitigation for the worse version of this.
- **No tests, no linter config.** Verification is by hand in the browser.
- **`applications` is the only source of truth.** If you add a feature, derive it
  in `App.jsx` rather than storing a second copy — that's the pattern the whole
  file follows.

---

## 11. Suggested reading order

1. `src/utils/storage.js` and `src/utils/date.js` — small, pure, no React.
2. `src/data/seedData.js` — see the shape of a real record.
3. `src/data/taxonomy.js` — pure functions, but the most *interesting* logic.
4. `src/App.jsx` lines 82–221 — state and the derivation pipeline.
5. `src/components/TrackerTable.jsx` — how a cell edit reaches state.
6. `src/pages/ApplicationDetailPage.jsx` and `src/hooks/useHashRoute.js`.
7. `src/App.jsx` lines 225–302 — the pending-row logic, last, once the rest
   makes sense.
