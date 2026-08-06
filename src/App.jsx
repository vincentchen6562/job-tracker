import { useEffect, useMemo, useRef, useState } from 'react';
import TrackerTable from './components/TrackerTable';
import ApplicationSummaryCard from './components/ApplicationSummaryCard';
import Toolbar from './components/Toolbar';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import { useHashRoute } from './hooks/useHashRoute';
import { seedApplications, STATUS_OPTIONS } from './data/seedData';
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
  };
}

export default function App() {
  const route = useHashRoute();
  const [applications, setApplications] = useState(
    () => loadApplications() ?? seedApplications
  );
  const [sort, setSort] = useState({ key: 'date', direction: 'asc' });
  const [theme, setTheme] = useState(() => loadTheme() ?? 'light');
  const [message, setMessage] = useState('');
  const cardRefs = useRef({});

  useEffect(() => {
    saveApplications(applications);
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

  const sorted = useMemo(() => {
    const copy = [...applications];
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
  }, [applications, sort]);

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

  function addApplication() {
    const created = blankApplication();
    setApplications((prev) => [created, ...prev]);
    setMessage('Added a blank application.');
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
    setMessage('Markdown downloaded.');
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

      {route.name !== 'detail' && (
        <Toolbar
          onAdd={addApplication}
          onExportMarkdown={exportMarkdown}
          onExportJson={exportJson}
          onImportJson={importJson}
          onReset={resetToSeed}
          count={applications.length}
        />
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
          />

          <section className="cards" aria-label="Applications">
            {sorted.map((app) => (
              <ApplicationSummaryCard
                key={app.id}
                app={app}
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
