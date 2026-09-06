import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TrackerTable from './components/TrackerTable';
import ApplicationSummaryCard from './components/ApplicationSummaryCard';
import Toolbar from './components/Toolbar';
import FilterBar from './components/FilterBar';
import Pagination from './components/Pagination';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import { useHashRoute } from './hooks/useHashRoute';
import { seedApplications, STATUS_OPTIONS } from './data/seedData';
import { resolveFacets } from './data/taxonomy';
import {
  loadApplications,
  saveApplications,
  clearApplications,
  loadTheme,
  saveTheme,
  loadView,
  saveView,
} from './utils/storage';
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

function makeId() {
  return `app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function blankApplication() {
  return {
    id: makeId(),
    company: '',
    role: '',
    status: 'Not started',
    date: '',
    priority: 0,
    jobPostingUrl: '',
    notes: '',
    detail: '',
    // Empty means "infer from the role and notes" — see data/taxonomy.js.
    category: '',
    roleType: '',
    locations: [],
  };
}

// Every token has to appear somewhere, so "auckland grad" narrows rather
// than widens.
function matchesQuery(app, facets, tokens) {
  if (tokens.length === 0) return true;
  const haystack = [
    app.company,
    app.role,
    app.status,
    app.date,
    app.notes,
    app.detail,
    facets.category,
    facets.roleType,
    facets.locations.join(' '),
  ]
    .filter(Boolean)
    .join(' \n ')
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

export default function App() {
  const route = useHashRoute();
  const [applications, setApplications] = useState(
    () => loadApplications() ?? seedApplications
  );
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
  const [message, setMessage] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const cardRefs = useRef({});

  useEffect(() => {
    setSaveFailed(!saveApplications(applications));
  }, [applications]);

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

  function updateApplication(id, patch) {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, ...patch } : app))
    );
  }

  function removeApplication(id) {
    const target = applications.find((app) => app.id === id);
    const name = target?.company || 'this application';
    if (!window.confirm(`Remove ${name}? This can't be undone.`)) return;
    setApplications((prev) => prev.filter((app) => app.id !== id));
    if (id === pendingId) setPendingId(null);
    setMessage(`Removed ${name}.`);
    if (route.name === 'detail' && route.id === id) {
      window.location.hash = '#/';
    }
  }

  function clearFilters() {
    setQuery('');
    setFilters(NO_FILTERS);
  }

  function addApplication() {
    const created = blankApplication();
    setApplications((prev) => [created, ...prev]);
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

  function importJson(raw) {
    if (!raw) {
      setMessage("Couldn't read that file.");
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('not an array');
      const cleaned = parsed.map((item) => ({
        ...blankApplication(),
        ...item,
        id: item.id || makeId(),
      }));
      setApplications(cleaned);
      setMessage(`Restored ${cleaned.length} applications.`);
    } catch {
      setMessage("That file isn't a tracker backup.");
    }
  }

  function resetToSeed() {
    if (!window.confirm('Replace everything with the original seed data?')) return;
    clearApplications();
    setApplications(seedApplications);
    clearFilters();
    setMessage('Reset to seed data.');
  }

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <p className="eyebrow">Graduate job search · Auckland</p>
          <h1>Application tracker</h1>
        </div>
        <p className="masthead__note">
          Everything saves to this browser automatically. Download a backup before
          switching machines.
        </p>
        <button
          type="button"
          className="btn btn--icon masthead__theme"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      {saveFailed && (
        <div className="flash flash--warn" role="alert">
          <span>
            Couldn't save to this browser — recent edits exist only on this page
            and will be lost if you close it. Download a backup now.
          </span>
          <button type="button" className="btn" onClick={exportJson}>
            Download backup
          </button>
        </div>
      )}

      {route.name !== 'detail' && (
        <>
          <Toolbar
            onAdd={addApplication}
            onExportMarkdown={exportMarkdown}
            onExportJson={exportJson}
            onImportJson={importJson}
            onReset={resetToSeed}
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

      {route.name === 'detail' ? (
        <ApplicationDetailPage
          application={applications.find((app) => app.id === route.id)}
          onUpdate={updateApplication}
          onRemove={removeApplication}
        />
      ) : (
        <>
          {view === 'table' ? (
            <TrackerTable
              applications={visible}
              sort={sort}
              onSortChange={setSort}
              onUpdate={updateApplication}
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
      )}
    </div>
  );
}
