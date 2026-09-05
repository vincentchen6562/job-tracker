import { useEffect, useMemo, useRef, useState } from 'react';
import TrackerTable from './components/TrackerTable';
import ApplicationSummaryCard from './components/ApplicationSummaryCard';
import Toolbar from './components/Toolbar';
import FilterBar from './components/FilterBar';
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
} from './utils/storage';
import { parseTrackerDate } from './utils/date';
import { toMarkdown, toJson, downloadFile } from './utils/exportData';

const STATUS_ORDER = STATUS_OPTIONS.reduce((acc, status, index) => {
  acc[status] = index;
  return acc;
}, {});

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
    location: '',
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

  const filtered = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

    return applications.filter((app) => {
      const facets = facetsById.get(app.id);
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
      return matchesQuery(app, facets, tokens);
    });
  }, [applications, facetsById, filters, query]);

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
    // A blank application matches nothing, so it would be added and then
    // immediately hidden by whatever is filtered.
    if (filtersActive) clearFilters();
    setMessage(
      filtersActive
        ? 'Added a blank application — filters cleared so you can see it.'
        : 'Added a blank application.'
    );
    setTimeout(() => {
      cardRefs.current[created.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 60);
  }

  function registerRef(id, node) {
    if (node) cardRefs.current[id] = node;
    else delete cardRefs.current[id];
  }

  function exportMarkdown() {
    downloadFile(
      'application-tracker.md',
      toMarkdown(sorted),
      'text/markdown;charset=utf-8'
    );
    setMessage(
      filtersActive
        ? `Markdown downloaded — ${sorted.length} of ${applications.length} (filters applied).`
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
          />
          <FilterBar
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onFilterChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
            onClear={clearFilters}
            counts={counts}
            shown={filtered.length}
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
          <TrackerTable
            applications={sorted}
            sort={sort}
            onSortChange={setSort}
            onUpdate={updateApplication}
            onRemove={removeApplication}
            emptyMessage={
              filtersActive
                ? 'Nothing matches the current search and filters.'
                : 'No applications yet. Use “Add application” to start one.'
            }
          />

          <section className="cards" aria-label="Applications">
            {sorted.map((app) => (
              <ApplicationSummaryCard
                key={app.id}
                app={app}
                facets={facetsById.get(app.id)}
                onRemove={removeApplication}
                registerRef={registerRef}
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
