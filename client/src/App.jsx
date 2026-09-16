import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TrackerTable from './components/TrackerTable';
import ApplicationSummaryCard from './components/ApplicationSummaryCard';
import Toolbar from './components/Toolbar';
import FilterBar from './components/FilterBar';
import Pagination from './components/Pagination';
import RestoreBackupButton from './components/RestoreBackupButton';
import SaveStatus from './components/SaveStatus';
import SessionEndedDialog from './components/SessionEndedDialog';
import AccountPage from './pages/AccountPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import { useHashRoute } from './hooks/useHashRoute';
import { useApplicationsSync } from './hooks/useApplicationsSync';
import { STATUS_OPTIONS, applicationDefaults } from '@job-tracker/shared';
import { resolveFacets } from './data/taxonomy';
import { loadTheme, saveTheme, loadView, saveView } from './utils/storage';
import { parseTrackerDate } from './utils/date';
import { toMarkdown, toJson, downloadFile } from './utils/exportData';

const STATUS_ORDER = STATUS_OPTIONS.reduce((acc, status, index) => {
  acc[status] = index;
  return acc;
}, {});

// Cards are much taller than table rows, so a page of them is shorter.
const PAGE_SIZE = { table: 10, cards: 6 };

const NO_FILTERS = {
  category: 'all',
  roleType: 'all',
  location: 'all',
  priority: 'all',
};

// Stands in while the account's applications load, so everything derived
// from the list below always has one to work on.
const NO_APPLICATIONS = [];

// Every token has to appear somewhere, so "auckland grad" narrows rather
// than widens.
function matchesQuery(app, facets, tokens) {
  if (tokens.length === 0) return true;
  const haystack = [
    app.company,
    app.role,
    app.status,
    app.date,
    app.summary,
    app.details,
    facets.category,
    facets.roleType,
    facets.locations.join(' '),
  ]
    .filter(Boolean)
    .join(' \n ')
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

// `notice` is a message that stays until dismissed, for something the account
// holder mustn't miss.
export default function App({
  account,
  onLogout,
  onAccountDeleted,
  onSwitchAccount,
  notice,
  onDismissNotice,
}) {
  const route = useHashRoute();
  const [message, setMessage] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);
  // Which replacement of the whole list is under way — 'backup' or
  // 'seed data' — or null when none is.
  const [replacing, setReplacing] = useState(null);
  const sync = useApplicationsSync({
    accountId: account.id,
    onSaveRejected: (error) => setMessage(`A change wasn't saved. ${error.message}`),
    onSessionEnded: () => setSessionEnded(true),
  });
  const loading = sync.applications === null;
  const applications = sync.applications ?? NO_APPLICATIONS;
  const [sort, setSort] = useState({ key: 'date', direction: 'asc' });
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [view, setView] = useState(() => loadView() ?? 'table');
  const [page, setPage] = useState(1);
  const [focusId, setFocusId] = useState(null);
  // A just-added application is held out of the sort and the filters, parked
  // at the end of the list, until editing finishes. Deliberately not
  // persisted — a reload releases it.
  const [pendingId, setPendingId] = useState(null);
  const visitedPendingDetail = useRef(false);
  const [theme, setTheme] = useState(() => loadTheme() ?? 'light');
  const cardRefs = useRef({});

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveView(view);
  }, [view]);

  // Narrowing the list should put you back at the start of it.
  useEffect(() => {
    setPage(1);
  }, [query, filters]);

  // The browser's leave-site warning, while closing the tab would lose edits.
  const unsaved = sync.saveStatus !== 'saved';
  useEffect(() => {
    if (!unsaved) return undefined;
    function warn(event) {
      event.preventDefault();
      // Older browsers only warn when this is set.
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  const facetsById = useMemo(() => {
    const map = new Map();
    applications.forEach((app) => map.set(app.id, resolveFacets(app)));
    return map;
  }, [applications]);

  const counts = useMemo(() => {
    const tally = { category: {}, roleType: {}, location: {}, priority: {} };
    const bump = (bucket, key) => {
      tally[bucket][key] = (tally[bucket][key] ?? 0) + 1;
    };

    applications.forEach((app) => {
      const facets = facetsById.get(app.id);
      bump('category', facets.category);
      bump('roleType', facets.roleType);
      facets.locations.forEach((location) => bump('location', location));
      bump('priority', String(Number(app.priority) || 0));
    });

    return tally;
  }, [applications, facetsById]);

  const filtersActive =
    query.trim() !== '' || Object.values(filters).some((value) => value !== 'all');

  const matchesFilters = useCallback(
    (app) => {
      const facets = facetsById.get(app.id) ?? resolveFacets(app);
      if (filters.category !== 'all' && facets.category !== filters.category) return false;
      if (filters.roleType !== 'all' && facets.roleType !== filters.roleType) return false;
      if (filters.location !== 'all' && !facets.locations.includes(filters.location)) {
        return false;
      }
      if (
        filters.priority !== 'all' &&
        (Number(app.priority) || 0) !== Number(filters.priority)
      ) {
        return false;
      }
      return matchesQuery(app, facets, query.toLowerCase().split(/\s+/).filter(Boolean));
    },
    [facetsById, filters, query]
  );

  const filtered = useMemo(
    () => applications.filter((app) => app.id !== pendingId && matchesFilters(app)),
    [applications, matchesFilters, pendingId]
  );

  const sorted = useMemo(() => {
    const copy = [...filtered];
    const dir = sort.direction === 'asc' ? 1 : -1;

    copy.sort((a, b) => {
      if (sort.key === 'date') {
        const at = parseTrackerDate(a.date);
        const bt = parseTrackerDate(b.date);
        if (at === null && bt === null) return 0;
        if (at === null) return 1; // undated always sinks to the bottom
        if (bt === null) return -1;
        return (at - bt) * dir;
      }
      if (sort.key === 'priority') {
        return ((Number(a.priority) || 0) - (Number(b.priority) || 0)) * dir;
      }
      if (sort.key === 'status') {
        return ((STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)) * dir;
      }
      return String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? '')) * dir;
    });

    return copy;
  }, [filtered, sort]);

  // Parked at the very end, so it lands on the last page and stays put while
  // the fields it would sort on are still being typed.
  const pendingApp = pendingId
    ? applications.find((app) => app.id === pendingId) ?? null
    : null;
  const ordered = pendingApp ? [...sorted, pendingApp] : sorted;

  const emptyMessage = filtersActive
    ? 'Nothing matches the current search and filters.'
    : 'No applications yet. Use “Add application” to start one.';

  // A new account has nothing to search, filter or page through yet.
  const accountIsEmpty = !loading && applications.length === 0;

  const pageSize = PAGE_SIZE[view];
  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  // Deleting or filtering can strand you past the end; clamp on the way out
  // rather than fighting the state.
  const safePage = Math.min(page, pageCount);
  const visible = ordered.slice((safePage - 1) * pageSize, safePage * pageSize);
  // Only worth padding a short page while there is pagination to hold still.
  const fillTo = pageCount > 1 ? pageSize : 0;
  const fillerCards = visible.length > 0 ? Math.max(0, fillTo - visible.length) : 0;

  // The new row is parked at the end of the list, so jump to the page that
  // end sits on.
  useEffect(() => {
    if (!focusId) return undefined;
    const index = ordered.findIndex((app) => app.id === focusId);
    if (index === -1) {
      setFocusId(null);
      return undefined;
    }
    setPage(Math.floor(index / pageSize) + 1);
    const timer = setTimeout(() => {
      cardRefs.current[focusId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setFocusId(null);
    }, 80);
    return () => clearTimeout(timer);
  }, [focusId, ordered, pageSize]);

  // Editing is over: let the row rejoin the sort and face the filters.
  function commitPending() {
    if (!pendingId) return;
    const app = applications.find((item) => item.id === pendingId);
    setPendingId(null);
    if (app && filtersActive && !matchesFilters(app)) {
      setMessage(
        `${app.company || 'That application'} is hidden by the current filters.`
      );
    }
  }

  // Card view has no inline editing — the detail page is where it happens, so
  // coming back from it is the signal that editing is finished.
  useEffect(() => {
    if (!pendingId) {
      visitedPendingDetail.current = false;
      return;
    }
    if (route.name === 'detail' && route.id === pendingId) {
      visitedPendingDetail.current = true;
    } else if (visitedPendingDetail.current) {
      visitedPendingDetail.current = false;
      setPendingId(null);
    }
  }, [route, pendingId]);

  function removeApplication(id) {
    const target = applications.find((app) => app.id === id);
    const name = target?.company || 'this application';
    if (!window.confirm(`Remove ${name}? This can't be undone.`)) return;
    if (id === pendingId) setPendingId(null);
    setMessage(`Removed ${name}.`);
    if (route.name === 'detail' && route.id === id) {
      window.location.hash = '#/';
    }
    sync
      .remove(id)
      .catch(() => setMessage(`Couldn't remove ${name}, so it's back in the list. Try again.`));
  }

  function clearFilters() {
    setQuery('');
    setFilters(NO_FILTERS);
  }

  function addApplication() {
    const created = { id: crypto.randomUUID(), ...applicationDefaults() };
    sync.add(created);
    // Held at the end of the list rather than dropped into its sorted place,
    // which would move it out from under the cursor mid-edit.
    setPendingId(created.id);
    setFocusId(created.id);
    setMessage(
      view === 'table'
        ? 'Added a blank application at the end — it sorts into place when you finish editing.'
        : 'Added a blank application at the end — open it to fill it in.'
    );
  }

  function registerRef(id, node) {
    if (node) cardRefs.current[id] = node;
    else delete cardRefs.current[id];
  }

  function exportMarkdown() {
    downloadFile(
      'application-tracker.md',
      toMarkdown(ordered),
      'text/markdown;charset=utf-8'
    );
    setMessage(
      filtersActive
        ? `Markdown downloaded — ${ordered.length} of ${applications.length} (filters applied).`
        : 'Markdown downloaded.'
    );
  }

  function exportJson() {
    downloadFile(
      'application-tracker-backup.json',
      toJson(applications),
      'application/json'
    );
    setMessage('Backup downloaded.');
  }

  // What restoring a backup and resetting to the seed data have in common:
  // both replace every application, so both hold the buttons still, bring the
  // whole list back into view, and leave it as it was if the server refuses.
  async function replaceApplications({ kind, replace, done, couldNot }) {
    setReplacing(kind);
    try {
      const applications = await replace();
      setPendingId(null);
      clearFilters();
      setMessage(done(applications));
    } catch (error) {
      setMessage(`${couldNot} ${error.message}`);
    } finally {
      setReplacing(null);
    }
  }

  // The file goes to the server as it is, and the server works out which
  // version of backup it is.
  async function restoreBackup(file) {
    const confirmed = window.confirm(
      `Restore ${file.name}? This replaces every application in your account with the ones in the backup, and can't be undone.`
    );
    if (!confirmed) return;

    let contents;
    try {
      contents = await file.text();
    } catch {
      setMessage("Couldn't read that file.");
      return;
    }

    await replaceApplications({
      kind: 'backup',
      replace: () => sync.restore(contents),
      done: (restored) =>
        `Restored ${restored.length} ${restored.length === 1 ? 'application' : 'applications'}.`,
      couldNot: "Couldn't restore the backup, so your applications are unchanged.",
    });
  }

  // Only a demo has seed data to go back to, so this is offered nowhere else.
  async function resetToSeed() {
    const confirmed = window.confirm(
      "Reset the demo to the seed data? This replaces every application in it, and can't be undone.",
    );
    if (!confirmed) return;

    await replaceApplications({
      kind: 'seed data',
      replace: sync.resetToSeed,
      done: (seeded) => `Reset to the seed data — ${seeded.length} applications.`,
      couldNot: "Couldn't reset the demo, so your applications are unchanged.",
    });
  }

  // Edits go out first, since logging out ends the session they're saved
  // with. Stays on the tracker if they can't be saved, or if the server
  // didn't hear the logout while the session is still alive.
  async function logOut() {
    if (!(await sync.saveEverything())) {
      setMessage("Some edits couldn't be saved, so you're still logged in. Retry, then log out.");
      return;
    }
    onLogout().catch((error) => setMessage(`Couldn't log out. ${error.message}`));
  }

  // Held edits only go to the account they were made in. Another account
  // gets a fresh tracker, and these edits go with this one.
  function logBackIn(loggedIn) {
    if (loggedIn.id !== account.id) {
      onSwitchAccount(loggedIn, { discardedEdits: unsaved });
      return;
    }
    setSessionEnded(false);
    sync.resume();
  }

  function renderMain() {
    if (loading) {
      return sync.loadError ? null : (
        <p className="cards__empty">Loading your applications…</p>
      );
    }

    if (route.name === 'account') {
      return (
        <AccountPage
          account={account}
          applicationCount={applications.length}
          onDownloadBackup={exportJson}
          waitForSaves={sync.saveEverything}
          onSessionEnded={() => setSessionEnded(true)}
          onDeleted={onAccountDeleted}
        />
      );
    }

    if (route.name === 'detail') {
      return (
        <ApplicationDetailPage
          application={applications.find((app) => app.id === route.id)}
          onUpdate={sync.update}
          onRemove={removeApplication}
        />
      );
    }

    if (accountIsEmpty) {
      return (
        <section className="empty-state">
          <h2 className="empty-state__title">No applications yet</h2>
          <p className="empty-state__text">
            Add your first application, or restore a backup of an earlier tracker. Everything
            saves to your account.
          </p>
          <div className="empty-state__actions">
            <button type="button" className="btn btn--primary" onClick={addApplication}>
              Add application
            </button>
            <RestoreBackupButton
              onRestore={restoreBackup}
              restoring={replacing === 'backup'}
              busy={replacing !== null}
            />
            {account.isDemo && (
              <button
                type="button"
                className="btn"
                onClick={resetToSeed}
                disabled={replacing !== null}
              >
                {replacing === 'seed data' ? 'Resetting…' : 'Reset to seed data'}
              </button>
            )}
          </div>
        </section>
      );
    }

    return (
      <>
        {view === 'table' ? (
          <TrackerTable
            applications={visible}
            sort={sort}
            onSortChange={setSort}
            onUpdate={sync.update}
            onRemove={removeApplication}
            emptyMessage={emptyMessage}
            fillTo={fillTo}
            pendingId={pendingId}
            onCommitPending={commitPending}
          />
        ) : visible.length === 0 ? (
          <p className="cards__empty">{emptyMessage}</p>
        ) : (
          <section className="cards" aria-label="Applications">
            {visible.map((app) => (
              <ApplicationSummaryCard
                key={app.id}
                app={app}
                facets={facetsById.get(app.id)}
                pending={app.id === pendingId}
                onRemove={removeApplication}
                registerRef={registerRef}
              />
            ))}

            {Array.from({ length: fillerCards }, (_, index) => (
              <div key={`filler-${index}`} className="cards__filler" aria-hidden="true" />
            ))}
          </section>
        )}

        <Pagination
          page={safePage}
          pageCount={pageCount}
          total={ordered.length}
          pageSize={pageSize}
          onChange={setPage}
        />
      </>
    );
  }

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <p className="eyebrow">Graduate job search · Auckland</p>
          <h1>Application tracker</h1>
        </div>
        <p className="masthead__note">
          Edits save to your account as you go, so the tracker is the same on every
          device you log in to.
        </p>
        <div className="masthead__actions">
          <SaveStatus status={sync.saveStatus} onRetry={sync.retry} />
          <span
            className="masthead__account"
            title={account.isDemo ? 'You are trying the demo' : 'Logged in as'}
          >
            {account.email ?? 'Demo account'}
          </span>
          <a className="btn btn--quiet" href="#/account">
            Account
          </a>
          <button type="button" className="btn btn--quiet" onClick={logOut}>
            Log out
          </button>
          <button
            type="button"
            className="btn btn--icon masthead__theme"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      {notice && (
        <div className="flash flash--warn" role="alert">
          <span>{notice}</span>
          <button type="button" className="btn" onClick={onDismissNotice}>
            Dismiss
          </button>
        </div>
      )}

      {sync.loadError && (
        <div className="flash flash--warn" role="alert">
          <span>Couldn't load your applications. {sync.loadError.message}</span>
          <button type="button" className="btn" onClick={sync.reload}>
            Try again
          </button>
        </div>
      )}

      {route.name === 'home' && !loading && !accountIsEmpty && (
        <>
          <Toolbar
            onAdd={addApplication}
            onExportMarkdown={exportMarkdown}
            onExportJson={exportJson}
            onRestore={restoreBackup}
            onResetToSeed={account.isDemo ? resetToSeed : null}
            replacing={replacing}
            view={view}
            onViewChange={setView}
          />
          <FilterBar
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onFilterChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
            onClear={clearFilters}
            counts={counts}
            shown={ordered.length}
            total={applications.length}
          />
        </>
      )}

      {message && (
        <p className="flash" role="status">
          {message}
        </p>
      )}

      {renderMain()}

      <SessionEndedDialog
        open={sessionEnded}
        email={account.email}
        isDemo={account.isDemo}
        onLoggedIn={logBackIn}
        onDemoEnded={onAccountDeleted}
        onClose={() => setSessionEnded(false)}
      />
    </div>
  );
}
