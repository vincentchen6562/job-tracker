# Job Application Tracker — Codebase Walkthrough

A reading guide to the app as it stands at commit `0183ad6`. Written to be read
alongside the source, top to bottom, so you can get your hands back on the code.

Two companion documents carry things this one deliberately doesn't repeat:

- **[CONTEXT.md](CONTEXT.md)** is the vocabulary. *Application*, *Facet*,
  *Demo account*, *Backup*, *Seed data* and the rest are defined there, along
  with the words to avoid. This walkthrough uses those terms as defined.
- **[docs/adr/](docs/adr/)** holds the decisions and, more usefully, the
  options that were rejected and why. Where the code makes a choice that looks
  arbitrary, there's usually an ADR behind it, cited inline below as
  (ADR-000N).

---

## 1. The thirty-second version

A MERN app in three npm workspaces. React and Vite on the front, Express and
MongoDB on the back, and a small shared package so the two can't disagree about
what an application is. You need an account to use it; a visitor who just wants
a look presses **Try the demo** and gets a temporary one (ADR-0005).

- **client** — ~3,170 lines of JS/JSX and ~1,620 lines of hand-written CSS.
  React 18, `react-markdown` + `remark-gfm`, Vite 8. No router library, no CSS
  framework, no state library.
- **server** — ~1,070 lines across 13 modules, plus ~1,750 lines of tests.
  Express 5, Mongoose 9, `express-session` + `connect-mongo`, `bcrypt`,
  `helmet`, `express-rate-limit`. Node 22.12 or newer.
- **shared** — 64 lines. The status list, the application's fields and
  defaults, the password rule, and the demo's lifetime.
- **Tests** — Vitest + Supertest, 115 tests across 12 files, driving the real
  Express app over HTTP against an in-memory MongoDB replica set.

```
package.json          npm workspaces; the root scripts run all three
├── client/
│   ├── index.html         root div + font links + module script
│   └── src/
│       ├── main.jsx       sets the theme, then renders <AuthGate/>
│       ├── AuthGate.jsx   logged in? → App. Logged out? → AuthPage.
│       ├── App.jsx        ALL tracker state lives here
│       ├── components/    presentational, state comes down as props
│       ├── pages/         auth, account, and the application detail route
│       ├── hooks/         the hash router and the applications sync
│       ├── data/          the facet taxonomy
│       └── utils/         the API client, date parsing, export, preferences
├── server/
│   ├── src/               config, app factory, routers, models
│   ├── scripts/           admin CLI: reset a password, check transactions
│   └── test/              the API test suite
├── shared/src/            what both sides agree on
├── frontdoor/             the permanent public link (GitHub Pages)
└── docs/adr/              the decision records
```

**Root commands.** `npm run dev` starts Vite and Express together;
`npm test` runs the server suite; `npm run build` builds the client to
`client/dist/`, which the server serves in production. See the
[README](README.md) for environment variables and the Atlas setup.

**One origin.** In production Express serves the built client at `/` and the
API under `/api` (ADR-0004), so the session cookie is a same-origin cookie and
there is no CORS to configure. In development Vite serves the client and
forwards `/api` to Express — that's the `proxy` block in `client/vite.config.js`,
which exists purely to make development match production.

**`base: './'`** in `vite.config.js` is why routing is hash-based: the built app
has to work from a sub-path. The only network request the page makes on its own
is Google Fonts — Space Grotesk (display), Inter (body), IBM Plex Mono (dates,
URLs, status pills).

---

## 2. `shared/` — the things that mustn't drift

Four tiny files, and worth reading first because everything else imports them.

- **`statuses.js`** — `STATUS_OPTIONS`, in *pipeline order*: Not started, In
  progress, Submitted, Interview, Offer, Rejected, Refused, No response. The
  order is load-bearing twice over: it's the sort order (`STATUS_ORDER` in
  `App.jsx` is built from it) and it's the server's validation `enum`.
- **`application.js`** — `applicationDefaults()`, the canonical definition of
  an application, plus `PRIORITY_MIN`/`PRIORITY_MAX`. It's a *function*, not a
  constant, so each new application gets its own `locations` array rather than
  sharing one.
- **`account.js`** — the password rule (`PASSWORD_MIN` 10, `PASSWORD_MAX` 128),
  `ACCOUNT_HEADER`, and `DEMO_LIFETIME_HOURS`/`DEMO_LIFETIME_MS`.
- **`index.js`** — the public surface. Import from `@job-tracker/shared`, never
  from a file inside it.

The payoff shows up in `server/src/applications.js`, which doesn't hand-write a
Mongoose schema at all: `fieldDefinitions()` *derives* the schema from
`applicationDefaults()`, inferring each path's type from the default's type. Add
a field to the shared defaults and the server accepts, validates, stores and
returns it with no other change.

---

## 3. The data model

### One application

`applicationDefaults()` in `shared/src/application.js` is the canonical list.

| Field | Type | Notes |
|---|---|---|
| `id` | string | `crypto.randomUUID()`, made **in the browser** (ADR-0007); seed rows keep readable ids like `'kowhai-labs'` |
| `company` | string | |
| `role` | string | |
| `status` | string | one of `STATUS_OPTIONS` |
| `date` | string | **free text**, not a Date — `"3 Aug 2026"`, `"Jul 2026"`, `""` |
| `priority` | number | 0–5 whole number, 0 meaning unrated |
| `jobPostingUrl` | string | |
| `summary` | string | the one line shown on the card (ADR-0011) |
| `details` | string | markdown, shown on the detail page (ADR-0011) |
| `category` | string | `''` means "infer it" |
| `roleType` | string | `''` means "infer it" |
| `locations` | string[] | `[]` means "infer it" |

Three things to notice. First, `date` being a string is deliberate — the
tracker came from a markdown document with loose dates, and `utils/date.js`
exists purely to sort those strings. Second, the last three fields use *empty as
a sentinel* for "let the classifier decide", which is the whole reason
`data/taxonomy.js` exists. Third, **the browser makes the id**: an application
that is added and never typed into is never sent anywhere, so it leaves nothing
behind (ADR-0007). That's also why the server's write route is a `PUT` upsert —
the browser already knows the id it wants.

### What the server stores

Two Mongoose models, both looked up *per connection* (`accountModel(db)`,
`applicationModel(db)`) rather than registered once globally, because each test
file brings its own database.

**Account** (`server/src/accounts.js`)

- `email` — trimmed, lowercased, `{ unique: true, sparse: true }`. **Sparse
  matters**: a demo account has no email, and without `sparse` every demo would
  index as the same missing value and only the first could ever be created. A
  database made before demo accounts has the old non-sparse index and needs it
  dropped by hand — the README has the command.
- `passwordHash` — bcrypt, cost 12. Absent for demo accounts.
- `isDemo`, `expiresAt` (demo only), `createdAt`.
- A **TTL index** on `expiresAt` with `expireAfterSeconds: 0`. Documents
  without the field — every real account — are left alone.

**Application** (`server/src/applications.js`)

- `accountId`, plus the browser's `id`, with a **compound unique index** on
  `{ accountId, id }`: unique per account, not globally (ADR-0007).
- `expiresAt`, set only on a demo's applications, with the same TTL index.
  It is not one of the browser's fields, so it is never sent back and no
  request can set it.
- `{ id: false }` on the schema, because Mongoose's own `id` virtual would
  otherwise shadow the browser's `id`.

**Sessions** are owned by `connect-mongo`, in a `sessions` collection, with
`stringify: false` so the session body is stored as an object. That's what makes
`endSessions()` able to find every session for an account with
`{ 'session.accountId': accountId }` — which is how a password change logs out
your other devices and how deleting an account leaves nothing usable behind.

---

## 4. `server/src/` — the request's journey

### 4.1 `app.js` — the middleware order *is* the design

`createApp(config, db)` builds the Express app without opening a port, so the
tests can drive it directly. The runtime entry (`index.js`) is the only thing
that listens. Read `app.js` top to bottom; nearly every line is ordered on
purpose, and the comments say why:

1. **`trust proxy 1`** — Render terminates HTTPS one hop in front. Trusting
   that hop is what makes `Secure` cookies and per-IP rate limits see the truth.
2. **`helmet()`** — first, so the security headers cover the built client too.
3. **`GET /api/health`** — registered *before* the rate limiter, with
   `Access-Control-Allow-Origin: *`. The front door polls it while the server
   wakes; a limit here would strand a visitor (ADR-0010).
4. **The `/api` rate limiter**, then **`requireJson`** — a flood is turned away
   before the body parser does any work.
5. **The session middleware.**
6. **`/api/restore`** — mounted *before* `express.json()`, because a backup is
   read with a 50 MB limit of its own.
7. **`express.json()`**, then the routers.
8. **`/api/applications/reset-to-seed` before `/api/applications`** — the
   applications router owns `/:id`, so without this ordering the reset would be
   taken for an application whose id happens to be `reset-to-seed`.
9. **Static client** in production only (ADR-0004).
10. **`handleErrors`** last, so it catches everything above.

### 4.2 `config.js`

Reads the environment, and **refuses to start** when `MONGODB_URI` or
`SESSION_SECRET` is missing — a bad deploy should fail loudly rather than run
insecurely. `readPositiveNumber` gives every rate limit an env override, which
is what lets the tests exercise a limit by passing a tiny one instead of sending
a thousand requests. Three limits, per IP: `auth` (10 / 15 min), `demo`
(5 / hour), `api` (1000 / 15 min, generous enough for autosave).

### 4.3 `sessions.js`

`express-session` over MongoDB (ADR-0003). Cookies are `httpOnly`,
`SameSite=Lax`, `Secure` in production, 30 days, `rolling` so the clock restarts
on each use.

The interesting part is the demo handling, three functions that exist because a
demo's session must not outlive the account it belongs to:

- **`demoExpiry(req)`** — the expiry anything saved in this request should take.
  The demo's session *carries* it, so an autosave never has to look the account
  up. A demo's expiry never changes, so the copy can't drift.
- **`demoHasExpired(req)`** — MongoDB sweeps expired documents on its own
  schedule (roughly once a minute), so the session stops working *on* the
  expiry rather than waiting for the account to actually be deleted.
- **`pinDemoCookie`** — `rolling` re-stamps the cookie as "now + originalMaxAge"
  on every response, so a visitor who keeps using the demo would otherwise slide
  the cookie past the account. This re-points `originalMaxAge` at the demo's own
  expiry on each request. There's a test that waits 1.2 s and checks the cookie
  didn't move.

**`requireLogin`** also enforces the `X-Account-Id` header: a request naming a
different account than the session holds is refused with 401. That happens when
one tab logs in as someone else while another tab is still showing the first
account — acting on it would file the second account's edits under the first.

### 4.4 `auth.js`

Sign-up, login, logout, `me`, demo creation, change password, delete account.

- **`DECOY_HASH`** — a real bcrypt hash, compared against when there's no
  account or no password, so a login attempt takes the same time either way and
  the form can't be used to discover which emails have accounts. Both wrong
  email and wrong password return the same `401` message.
- **`startSession`** regenerates the session ID on login and sign-up, so a
  session ID captured before logging in can't ride the logged-in session. For a
  demo it also stores `demoExpiresAt` and shortens the cookie to match.
- **`destroySession`** on logout and account deletion removes the session from
  the *store*, not just the cookie, so a copied cookie stops working too.
- `PUT /password` and `DELETE /account` both sit behind `requireLogin` *and*
  `requireRealAccount` — that's the `403` a demo gets.

### 4.5 `applications.js`

The resource itself, always scoped to `req.session.accountId`.
`ownApplication(req)` builds every filter, which is why another account's
application and a missing one are indistinguishable — both `404`, deliberately.

- **`PUT /:id`** upserts, so the browser's first save is safe to retry.
- **`PATCH /:id`** merges only the fields sent, never creates, `404` if missing.
  Two devices patching *different* fields of the same application both survive
  (ADR-0008).
- `$setOnInsert: { expiresAt }` — only on creation, only in a demo, so an
  application added during a demo expires with it.
- `pickFields` drops anything not in the shared field list, and
  `sanitizeFilter` blocks query-operator injection.
- `GET /` sorts by `{ createdAt: 1, _id: 1 }` — a restore writes many
  applications in the same instant, so `_id` breaks the tie and the backup's
  order survives.

### 4.6 `restore.js`

Takes a backup file's JSON exactly as it was read and works out the version
itself. This logic used to live in the browser; moving it here is what put it
under test.

- **Version 1** is a bare array, **version 2** an object with applications and
  attachments, **version 3** the same without. Attachments are dropped
  (ADR-0009).
- `convertApplication` renames `notes` → `summary` and `detail` → `details`
  (ADR-0011), promotes an old singular `location` to `locations`, and drops
  everything the schema doesn't know. A value already under the new name wins.
- The whole replacement runs in **one transaction**, so a file that fails
  partway leaves the account exactly as it was. That's why the tests need a
  replica set rather than a standalone mongod.

### 4.7 `demo.js`

Small, and the clearest module to read for how the demo works end to end.
`createDemoAccount` takes **one** `expiresAt` and gives it to both the account
and its seed applications, so the two can never expire apart.

`requireAccountKind(db, { demo, error })` is the shared guard, and both
directions are built from it: `requireRealAccount` (the account settings a demo
has no use for) and `requireDemoAccount` (only a demo has seed data to return
to). It asks the *account*, not the session, so there's one place that decides
what a demo is.

The router also answers `405` on any method but `POST`, which is what stops an
application called `reset-to-seed` from squatting on the path.

### 4.8 `errors.js`, `protections.js`, `database.js`, `index.js`

- **`errors.js`** — the last middleware. Mongoose validation and cast errors
  become `400` naming the field; body-parser errors carry their own 4xx;
  anything else is logged and returns a flat `500`.
- **`protections.js`** — `requireJson` refuses any data-changing request that
  isn't `application/json`. A page on another site can post a form or a
  `text/plain` body without a preflight, but not JSON, so this plus
  `SameSite=Lax` is the CSRF defence. A request with no body has no content
  type and is refused too, which is why the client always sends at least `{}`.
  `createRateLimiter` wraps `express-rate-limit`; each call keeps its own count.
- **`database.js`** — eight lines. `mongoose.createConnection(...)`, not the
  global connection, so the app works with whatever it's handed.
- **`index.js`** — loads `.env` if present, loads config (exiting with a clear
  message on `ConfigError`), connects, builds, listens.

### 4.9 The API contract

| Method and path | Purpose | Notes |
|---|---|---|
| `GET /api/health` | Liveness for the front door | No auth, CORS-open |
| `POST /api/auth/signup` | Create account and log in | Duplicate email → `409` |
| `POST /api/auth/login` | Log in | Wrong either way → `401`, one message |
| `POST /api/auth/logout` | End this session | |
| `GET /api/auth/me` | Current account | `401` when logged out |
| `POST /api/auth/demo` | Create a demo and log in | Rate limited → `429` |
| `PUT /api/auth/password` | Change password | Ends other sessions; demo → `403` |
| `DELETE /api/auth/account` | Delete account | Removes applications + sessions; demo → `403` |
| `GET /api/applications` | The account's applications | |
| `PUT /api/applications/:id` | Create or merge | Safe to retry |
| `PATCH /api/applications/:id` | Merge changed fields | `404` if missing |
| `DELETE /api/applications/:id` | Delete one | |
| `POST /api/restore` | Replace all from a backup | Atomic; bad file → `400` |
| `POST /api/applications/reset-to-seed` | Replace with seed data | Demo only, else `403` |

Status codes across the API: `400` invalid body, `401` not logged in, `403` not
allowed for a demo, `404` missing *or another account's*, `415` not JSON,
`429` rate limited.

---

## 5. `client/src/AuthGate.jsx` — which screen you get

120 lines, and the thing to understand before `App.jsx`.

Nothing renders until `GET /api/auth/me` resolves — `account` starts
`undefined` (checking), becomes `null` (logged out) or the account. That's what
stops the wrong screen flashing up. `main.jsx` sets `data-theme` *before* the
first render for the same reason: the login screen shouldn't flash light when
dark was chosen.

Redirects use `window.location.replace`, not assignment, so Back doesn't return
to a screen that would only redirect again.

**`leavingDemo`** is the one deliberate exception to "logged in? then no auth
screens": a demo account *is* allowed onto `#/signup`, because that's how a
visitor turns a look around into an account that keeps things (ADR-0005).

`<App key={account.id}>` is doing real work. Keying by account means switching
accounts throws the whole tracker away rather than trying to reconcile one
account's state with another's data — which is also how held, unsaved edits are
guaranteed not to leak across.

---

## 6. `client/src/App.jsx` — the only stateful tracker component

619 lines. Read it in five passes.

### 6.1 The state (`App.jsx:72–95`)

```js
applications   // via the sync hook — null until loaded
sort           // { key, direction }
query          // the search box
filters        // { category, roleType, location, priority }, 'all' = off
view           // 'table' | 'cards'
page           // 1-based page number
focusId        // "scroll to this row/card once it exists"
pendingId      // "this row is being filled in — hold it out of the sort"
replacing      // 'backup' | 'seed data' | null — a whole-list replacement
sessionEnded   // show the log-back-in dialog over the page
theme          // 'light' | 'dark'
message        // the transient flash line
cardRefs       // useRef map of id → DOM node, for scrollIntoView
```

`view` and `theme` are lazily initialised from `localStorage` —
`useState(() => loadView())`. The arrow matters: without it you'd touch storage
on every render instead of once. **Only preferences live in storage now**;
applications are the server's.

### 6.2 The effects (`App.jsx:98–129`)

Each is a one-way sync out of state: theme to `document.documentElement.dataset`
and storage, view to storage, `setPage(1)` whenever the list narrows, and the
flash auto-dismiss with the `clearTimeout` cleanup that stops an old timer
clearing a *newer* message.

The one to read is the **leave-site warning** (`App.jsx:114`): registered only
while `sync.saveStatus !== 'saved'`, so you're warned about closing the tab
exactly when there's something unsaved, and not otherwise.

### 6.3 The derivation pipeline (`App.jsx:131–228`)

The heart of the file. One direction, six steps:

```
applications
  └─ facetsById   Map<id, facets>   memo on [applications]
  └─ counts       tally per facet   memo on [applications, facetsById]
  └─ filtered     drop pendingId, apply filters + search
  └─ sorted       apply the sort spec
  └─ ordered      re-append the pending row at the very end
  └─ visible      slice to the current page
```

**`facetsById`** builds the Map once per change rather than calling
`resolveFacets` inside the filter predicate, where it would re-run per row per
keystroke.

**`counts`** feeds the numbers in the filter dropdowns. It tallies over *all*
applications, not the filtered set, so the numbers don't shift under you while
you're choosing.

**`matchesFilters`** is a `useCallback` because `filtered` depends on it;
without the memo it'd be a new function every render and the `useMemo` below
would never hit.

**`matchesQuery`** (`App.jsx:41`) joins every searchable field into one
lowercased haystack and requires that **every** token appear —
`tokens.every(t => haystack.includes(t))`. That's an AND, so `auckland grad`
narrows rather than widens. Facet values are in the haystack too, so you can
search for an *inferred* category you never typed.

**`sorted`** copies before sorting (`[...filtered]`) because `Array.sort`
mutates. The comparator branches per key: `date` parses both sides and **null
always sinks** regardless of direction, so undated entries don't pretend to be
ancient; `priority` is numeric; `status` looks up `STATUS_ORDER` so statuses
sort in pipeline order, not alphabetically; everything else is `localeCompare`.

**Paging**: `PAGE_SIZE` is `{ table: 10, cards: 6 }` because cards are taller.
`safePage = Math.min(page, pageCount)` clamps on *read* rather than correcting
the `page` state — simpler, and deleting the last item on page 5 just shows
page 4 without an extra render. `fillerCards` pads a short last page so the
pagination bar doesn't jump up the screen.

### 6.4 The "pending application" dance

The subtlest thing in the client. You press **Add application**, get a blank
row, and start typing — if that row were in the sort it would leap around after
every keystroke, and if it faced the filters it would vanish the moment it
failed to match.

1. `addApplication()` makes the id with `crypto.randomUUID()`, prepends the
   record **and** sets `pendingId`. `filtered` excludes that id and `ordered`
   re-appends it at the very end, so it's parked on the last page, immovable.
   Nothing is sent to the server yet.
2. `focusId` triggers the effect at `App.jsx:232`, which finds the record in
   `ordered`, jumps to its page, then after an 80 ms beat calls `scrollIntoView`
   on the registered ref. The delay lets React commit the page change before the
   scroll targets a node that now exists.
3. Ending the edit differs by view. **Table**: `TrackerTable` puts `onBlur` on
   the pending `<tr>` and checks
   `event.currentTarget.contains(event.relatedTarget)`, so focus moving within
   the row doesn't count but leaving it calls `commitPending()`. **Cards**:
   there's no inline editing, so the signal is *navigation* — the effect at
   `App.jsx:261` uses a ref flag to remember "we visited this record's detail
   page" and clears `pendingId` when the route later moves away.

`commitPending()` does a courtesy check: if the freshly-typed record doesn't
match the active filters, it says so rather than letting the row silently
disappear. `pendingId` is deliberately **not** persisted — a reload releases it.

### 6.5 The actions

- **`sync.update(id, patch)`** is the single write path. Every editable control
  calls it with a one-key patch.
- **`removeApplication`** confirms, clears pending if it was pending, navigates
  home if you were on its detail page, and puts the row **back** with its
  unsaved edits if the server refuses.
- **`replaceApplications({ kind, replace, done, couldNot })`** is the shared
  spine of `restoreBackup` and `resetToSeed`: both replace every application, so
  both hold the buttons still, clear the filters and the pending row, and leave
  the list untouched if the server refuses. `kind` is what `replacing` holds, so
  a reset can disable the Restore button without claiming a backup is being
  restored.
- **`exportMarkdown`** exports `ordered` — *what you're currently looking at* —
  and says so in the flash when filters are on. **`exportJson`** exports
  `applications`, the whole account, because it's a backup.
- **`logOut`** sends pending edits *first* and stays put if they can't be
  saved, since logging out ends the session they'd be saved with.
- **`logBackIn`** compares ids: same account resumes the held queue, a different
  account hands off to `onSwitchAccount` and the edits go with the old tracker.

---

## 7. `client/src/hooks/useApplicationsSync.js` — the deepest module

352 lines, and the one to read slowly. It owns the applications array and keeps
the server in step: state changes immediately, the server hears in the
background (ADR-0008).

The refs are the state machine, and the comments on each declaration are the
real documentation:

| Ref | Holds |
|---|---|
| `unsent` | changed fields not sent yet, per application |
| `timers` | the 600 ms debounce timer, per application |
| `failedFields` | fields whose save failed; the next save sends them too |
| `inFlight` | the request on its way, per application |
| `onServer` | applications the server has — these use `PATCH` |
| `sentPut` | applications a `PUT` went out for, answered or not |
| `held` | true from the session ending until `resume()` |
| `logins` | counts `resume()`s, to date 401s correctly |
| `replacing` | a whole-list replacement on its way |

The rules that fall out of them:

- **Debounce per application, not globally** — `update()` resets only that
  application's timer, so typing in one row doesn't delay another's save.
- **`PUT` first, `PATCH` after.** `onServer` decides. Requests for one
  application are chained through `inFlight`, so a `PATCH` can never overtake
  the `PUT` that creates it.
- **Fields are read when the request goes out**, not when it's queued, so edits
  made while an earlier request was in flight are included, and newer edits win
  over failed ones.
- **Three failure kinds, three behaviours.** `validation` → tell the user and
  *drop* the value, since resending can't help. `not-found` → the application
  was deleted on another device, so forget it and queue the *whole* record for
  a `PUT` that puts it back. Anything else → keep the fields for a retry.
- **`callServer` is the choke point.** While `held`, it rejects *as though* it
  were a 401 without sending — so every caller's existing 401 handling keeps
  what didn't go out, and no request carries a cookie that now belongs to
  someone else. The `logins` counter stops a 401 for a request sent *before*
  logging back in from being mistaken for the new session ending.
- **`replaceEverything`** saves pending edits first (so they survive a refusal),
  then clears every queue and swaps the list. `enqueue` waits on `replacing` too,
  so nothing lands in the account after the backup or seed data replaced it.

`saveEverything()` is what logout and account deletion await: it flushes, waits
for every in-flight request, and returns whether *everything* reached the
server.

---

## 8. `client/src/utils/api.js` — the fetch wrapper

56 lines. Sends JSON, sends cookies (`credentials: 'same-origin'`), and turns
status codes into an **`ApiError`** with a `kind` — `validation`,
`unauthenticated`, `forbidden`, `not-found`, `conflict`, `rate-limited`,
`unexpected`, and `network` for status 0 when the server couldn't be reached at
all. Everything upstream branches on `kind`, never on the raw number.

Two details: a body is sent even when there's nothing to say (`{}`), because the
server refuses a data-changing request that isn't JSON; and `raw: true` passes a
backup file's text through untouched, so the browser never parses it.

---

## 9. `client/src/data/taxonomy.js` — the classifier

191 lines, no dependencies, pure functions. The premise: saved applications
don't carry category, role type or location, so rather than asking you to
backfill them the app **infers** them from text you already wrote.

Three rule tables, each an array of `[label, regex]`, **ordered most specific
first** — `firstMatch` returns on the first hit. That ordering is load-bearing:
`Quality engineering` is tested before `Software development` so "Test
Automation Engineer" isn't swallowed by the `engineer` in the software rule.

Each deriver has a wrinkle:

- **`deriveCategory`** tries the **role title alone** first, and only falls back
  to role + summary + details if that misses. Details mentioning "worked with
  the data team" shouldn't reclassify a developer role.
- **`deriveRoleType`** special-cases the bare word `grad`/`graduate` **in the
  title only** (`"…(2027 Grad Programme)"`), because in body text "welcomes
  recent graduates" is noise. Outside the title the rule demands
  graduate + programme/scheme/role/pathway.
- **`deriveLocations`** returns **all** matches, not the first, since an ad can
  say "Auckland or Christchurch". The regexes are city names only — the comment
  explains why: "University of Canterbury" in the details must not tag a job as
  Christchurch. Te reo names are included (`tāmaki makaurau`, `ōtautahi`), and
  `Remote` demands an emphatic phrase ("fully remote", "100% remote") rather
  than the bare word.

**`explicitLocations`** is a compatibility shim: prefers the `locations` array,
falls back to an older singular `location` string.

**`resolveFacets`** is what everything calls. It returns each resolved value
*plus* an `IsAuto` flag, which is how the UI marks an inferred facet: a dashed
chip on the cards, titled "… — inferred from the role, summary and details",
and an "Auto — *value*" option in the detail page's selects.

The classifier stays in the browser on purpose (ADR-0006) — search, filtering,
sorting and paging are all client-side, over the whole account loaded at login.

---

## 10. `client/src/components/`

### `TrackerTable.jsx` (204 lines)
A `COLUMNS` array drives the header; `sortable: false` on Role and Job posting
renders plain text instead of a sort button. `SortArrow` shows a neutral `↕` on
idle columns so every sortable header advertises itself.

Every cell is a **controlled input** wired straight to `onUpdate` — no local
draft state. Each keystroke reaches `App` state immediately and the server 600 ms
later, which is the whole point of the debounce living in the sync hook rather
than here.

The status `<select>` computes its own class from the value:
`` `status--${app.status.toLowerCase().replace(/\s+/g, '-')}` ``. That's the slug
convention below.

`pendingInput` and `focusedFor` implement autofocus-once: focus the new row's
company field, but only the first time it appears, so re-renders don't yank the
cursor back.

### `ApplicationSummaryCard.jsx` (114 lines)
Read-only by design — the card body is one `<a>` to the detail route, with the
footer's own links outside it so they don't nest inside an anchor. `chips`
flattens the three facets into one list and drops `Unspecified`. The `<ul>` is
always rendered even when empty, and the CSS reserves two lines each for role
and summary, so cards in a grid line up regardless of content.

### `AuthForm.jsx` (86 lines)
The email/password form, shared by three callers: the login screen, the sign-up
screen, and the dialog for logging back in. `mode` picks the endpoint, the
`autoComplete` value and the button label; `children` render below the submit
button, which is how **Try the demo** and "Not now" are slotted in.

### `SessionEndedDialog.jsx` (64 lines)
Shown over the page when the session ends, so unsaved edits stay put rather than
being navigated away from. A demo gets a different branch entirely — it has no
email or password to log back in with, so it's told the demo is over and offered
a way back to the start.

### `SaveStatus.jsx` (52 lines)
Saving… / Saved / Couldn't save, with an inline SVG per state and a **Retry**
button only on failure. `role="status"` + `aria-live="polite"` so it's announced
without stealing focus.

### `RestoreBackupButton.jsx` (37 lines)
Hidden `<input type="file">` behind a styled button, with
`event.target.value = ''` afterwards so re-picking the same file fires `change`
again. `busy` (any replacement under way) and `restoring` (this one's) are
separate props, so a reset to seed data disables the button without claiming a
backup is being restored.

### `Toolbar.jsx` (51 lines)
Add and the view toggle on the left; markdown, backup, restore and — for demo
accounts only — reset on the right. `onResetToSeed` is simply `null` for a real
account, so the button's existence and the account's kind are one decision made
in `App.jsx`.

### `FilterBar.jsx` (152 lines)
`FacetSelect` appends the count to each label. `usable()` is the good bit: it
hides options with a count of zero **except** the currently selected one, so the
dropdown stays short without ever silently dropping what you filtered by.
Location options are the premade centres *plus* any free-text city typed into a
tag box, sorted, with `Unspecified` pinned last.

### `Pagination.jsx` (81 lines)
`pageList(current, pageCount)` builds the strip: under 8 pages, all of them;
past that a `Set` of `[1, 2, current±1, last-1, last]` filtered to range, sorted,
with gaps larger than 1 becoming an ellipsis. Returns `null` for a single page —
the component decides its own visibility rather than the parent guarding the
call site.

### `StarRating.jsx` (39 lines)
`STAR_LEVELS` is derived from the shared priority range, so the stars follow
`PRIORITY_MAX` rather than hard-coding five. `const shown = hover || value` —
hover preview falls back to the real value, and `0` being falsy makes "no hover"
work without a null check. Clicking the star you're on clears the rating. It's a
`role="radiogroup"` with `onFocus`/`onBlur` mirroring the mouse handlers, so
keyboard users see the same preview.

### `TagInput.jsx` (110 lines)
Free-text tags for locations. Enter or `,` commits; Backspace on an empty box
removes the last tag; **blur also commits**, so a half-typed tag is never lost.
`add()` splits on commas (pasting "Auckland, Wellington" works), dedupes
case-insensitively, and only calls `onChange` if something changed. The
`onMouseDown` on the wrapper focuses the input when you click the padding, but
checks `event.target === event.currentTarget` so it doesn't steal the remove
buttons' clicks.

### `ViewToggle.jsx` (46 lines)
Two buttons with inline SVG icons, `aria-pressed`, and visually-hidden labels.

---

## 11. `client/src/pages/`

### `AuthPage.jsx` (85 lines)
Login and sign-up, which differ only in wording and endpoint. `TryTheDemo` is
the second half: one `POST /api/auth/demo`, no form, and a line saying the demo
is deleted after `DEMO_LIFETIME_HOURS` — read from the shared constant, so the
screen can't claim a different lifetime than the server enforces. `fromDemo`
adds the explanation that a real account starts empty.

### `AccountPage.jsx` (246 lines)
Change password and delete account, or — for a demo — neither. The
`account.isDemo` branch at the top swaps both settings for `SignUpInstead`,
which explains the expiry and offers **Download backup** before signing up. It's
the client half of the `403` that `requireRealAccount` returns (§4.4).

`DeleteAccount` awaits `waitForSaves()` before deleting, because a save landing
after the account is gone would create an application with no owner. Its
confirmation dialog offers a backup first, and a 401 mid-delete closes the
dialog and hands over to the login dialog rather than stacking two modals.

### `ApplicationDetailPage.jsx` (228 lines)
Handles the missing-record case first — you can bookmark a hash for something
you later deleted — before touching `application`.

Unlike the card, **everything here is editable**. `FacetField` is the
explicit/auto switch: its first `<option>` has `value=""` and reads
`Auto — Software development`, showing what the classifier *would* say; picking
it writes `''` and hands control back to inference. Location uses `TagInput`
instead, with the inferred cities as the placeholder.

The markdown **Details** have a single `editing` boolean: a `<textarea>` bound
to `app.details`, or `ReactMarkdown` with `remarkGfm` (tables, strikethrough,
task lists — the seed data uses tables heavily). A `useEffect` sets
`document.title` to the company name.

---

## 12. `client/src/utils/` and `hooks/useHashRoute.js`

### `date.js` (40 lines)
`parseTrackerDate` returns a timestamp or `null`. In order: empty / `—` / `-`
→ null; ISO `2026-08-03`; `3 Aug 2026` (month matched on its first three
letters, so "July" and "Jul" both work); `Aug 2026` → the 1st, so a month-only
entry sorts ahead of dated ones in that month; then `Date.parse` as a last
resort. `Date.UTC` throughout, so a date never shifts by a day with the timezone.

### `storage.js` (39 lines)
**Preferences only** — the theme and the card/table view, one key each,
namespaced `vc-application-tracker/…`, so each device keeps the layout that
suits its screen. Applications live on the server. Every call is wrapped in
try/catch because private-mode browsers throw, and failures are swallowed
silently: losing a theme preference isn't worth a banner.

### `exportData.js` (111 lines)
`toMarkdown` rebuilds the original notes document: an H1, a summary table, then
`---`-separated sections. `cell()` escapes pipes and flattens newlines so a
summary can't break the table; `stars()` renders `★★★★☆` against
`PRIORITY_MAX`; `slug()` builds the anchor that "Jump to section" links to. Each
section's metadata uses `resolveFacets`, so **inferred** values make it into the
export even though they were never typed.

`toJson` writes a **version 3** backup — format, version, `exportedAt`, and the
applications. `downloadFile` is the Blob → object URL → synthetic click → revoke
dance.

### `useHashRoute.js` (29 lines)
The entire router. `parseHash` matches `/login`, `/signup`, `/account` and
`/app/:id`, falling back to `home`. The hook subscribes to `hashchange`.
Navigation is just `<a href="#/…">` — no click handlers, no history library, and
Back works for free. Hash routing rather than the History API is what lets the
built `dist/` work under a sub-path without server rewrites.

---

## 13. `client/src/styles.css` (1,618 lines)

Hand-written, no framework. Structured as:

1. **Tokens** on `:root` — surfaces, ink, lines, accent, **eight** `--status-*`
   colours, radius, shadow, three font stacks.
2. **`:root[data-theme='dark']`** redefines the same names. Nothing else in the
   file is theme-aware, which is why dark mode is one `dataset.theme`
   assignment.
3. Section by section, roughly in page order, each with a banner comment:
   masthead, login and sign-up, the over-page dialog, the demo block, account
   page, save indicator, empty account, toolbar, view toggle, pagination, flash,
   table, status, stars, cards, summary cards, filter bar, chips, detail page,
   tag input, markdown.
4. `@media (max-width: 720px)` for phones, and
   `@media (prefers-reduced-motion: reduce)` killing transitions and smooth
   scroll.

Status colours work by setting `color` on the element and letting
`border: 1px solid currentColor` and `background: currentColor` (on the card
spine) pick it up — one variable per status drives the pill, the select and the
stripe.

---

## 14. `server/test/` — the suite

115 tests across 12 files, run by `npm test` from the root.

**The seam is the HTTP API.** Tests drive the real Express app through Supertest
and assert on responses and on what *later* requests return — "after deleting the
account, logging in fails and the old session gets 401", never "the accounts
collection is empty". They don't reach into Mongoose models or middleware. The
one deliberate exception is `expiresAt` and the TTL indexes, because MongoDB's
background sweep runs on its own schedule and can't be waited on.

- **`support/globalSetup.js`** starts one `MongoMemoryReplSet` for the whole
  run. A **replica set**, not a standalone — MongoDB only allows transactions on
  one, and restore depends on them.
- **`support/testApp.js`** — `useTestApp()` gives each file its own database
  (`test-<uuid>`), dropped afterwards, and an app built on it. Rate limits
  default to generous, because every test request comes from the same IP;
  `configOverrides.rateLimits` are **merged**, so a test lowering one limit
  keeps sane defaults for the rest.
- **`support/http.js`** — `signedUpBrowser`, `loggedInBrowser`, `logIn` and the
  cookie readers. A `request.agent` is "a browser": it keeps cookies across
  requests, so a test reads as a sequence of things one person did.

The files: `auth`, `account`, `sessions`, `applications`, `restore`, `demo`,
`protections`, `health`, `config`, `startup`, `client`, `reset-password`.

**CI** (`.github/workflows/ci.yml`) runs `npm ci`, `npm test` and
`npm run build` on every push and pull request, caching the in-memory MongoDB
binary outside `node_modules` so `npm ci` doesn't delete it.

---

## 15. `server/scripts/` and `frontdoor/`

- **`reset-password.js`** — the admin way back in for someone locked out, since
  there's no forgot-password flow (ADR-0002). Gives the account a random
  24-character password, logs it out everywhere via `setPassword`, and prints
  the password to pass on. It acts on whatever `MONGODB_URI` names, so it
  resets a production account when given production's string.
- **`check-transactions.js`** — a one-off that proves transactions work on a
  given database, written to confirm the Atlas free tier before restore relied
  on them. Checks both halves: a committed write is kept, an aborted one isn't.
- **`frontdoor/index.html`** — the permanent public link, published to GitHub
  Pages by its own workflow (ADR-0010). Render's free tier sleeps after 15
  minutes and takes about a minute to wake, so this page says "Waking the
  server…", polls `/api/health`, and redirects once it answers. It inlines the
  tracker's palette and fonts so it doesn't look like a different site. If
  hosting ever moves, change `TRACKER_URL` here and every link already printed
  on a CV keeps working.

---

## 16. Things worth knowing before you change anything

- **Adding a status** means three places: `STATUS_OPTIONS` in
  `shared/src/statuses.js`, a `--status-<slug>` variable in *both* `:root`
  blocks, and a `.status--<slug>` rule. The slug is lowercase with spaces →
  hyphens. Position in `STATUS_OPTIONS` also sets sort order, and the server's
  validation `enum`, for free.
- **Adding a field to an application** is one place: `applicationDefaults()` in
  `shared/src/application.js`. The server derives its schema path, validation,
  `pickFields` and `publicApplication` from it. Only the UI to edit it is
  yours to write.
- **The browser makes application ids**, not the server (ADR-0007). Anything
  that creates an application must generate an id and `PUT` it.
- **`404` and "not yours" are the same answer** on purpose. Don't add a
  distinguishing message to be helpful — it would turn the API into an oracle
  for which ids exist.
- **Every data-changing request must be JSON.** That's half the CSRF defence,
  so a new client call must send a body even when it has nothing to say.
- **A demo's expiry comes from the session**, not a lookup (`demoExpiry`). Any
  new route that creates data in a demo has to stamp `expiresAt` the same way,
  or it will leave orphans behind when the account is swept.
- **Search, filter, sort and page are client-side** over the whole account
  (ADR-0006). The server has no query parameters, and adding them is a decision
  to revisit, not a small change.
- **`facetsById` recomputes on every `applications` change**, so every keystroke
  re-runs the regexes over every record. Fine at this size; the Map is already
  the mitigation for the worse version of this.
- **`applications` is the only source of truth** in the client. If you add a
  feature, derive it in `App.jsx` rather than storing a second copy — that's the
  pattern the whole file follows.
- **The [README](README.md) owns running and deploying**; this file owns
  changing. When you add something a newcomer has to *do* — an environment
  variable, a command, a deploy step — it belongs there, not here.

---

## 17. Suggested reading order

1. `shared/src/` — all four files, five minutes, and everything else assumes them.
2. `server/src/app.js` — the middleware order is the architecture.
3. `server/src/applications.js` — how a schema is derived, and how ownership works.
4. `server/test/applications.test.js` — what "a good test" means here.
5. `client/src/AuthGate.jsx` — which screen you get and why nothing flashes.
6. `client/src/hooks/useApplicationsSync.js` — the hardest and most interesting file.
7. `client/src/App.jsx` lines 131–228 — the derivation pipeline.
8. `client/src/data/taxonomy.js` — pure functions, no React, genuinely clever.
9. `client/src/App.jsx` lines 232–305 — the pending-row logic, last, once the
   rest makes sense.
