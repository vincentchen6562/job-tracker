import { useEffect, useRef } from 'react';
import { STATUS_OPTIONS } from '../data/seedData';
import StarRating from './StarRating';

const COLUMNS = [
  { key: 'company', label: 'Company', sortable: true },
  { key: 'role', label: 'Role', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'priority', label: 'Priority', sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'jobPostingUrl', label: 'Job posting', sortable: false },
];

function SortArrow({ active, direction }) {
  if (!active) return <span className="sort-arrow sort-arrow--idle">↕</span>;
  return <span className="sort-arrow">{direction === 'asc' ? '↑' : '↓'}</span>;
}

export default function TrackerTable({
  applications,
  sort,
  onSortChange,
  onUpdate,
  onRemove,
  emptyMessage = 'No applications yet. Use “Add application” to start one.',
  fillTo = 0,
  pendingId = null,
  onCommitPending,
}) {
  const fillerRows = applications.length > 0 ? Math.max(0, fillTo - applications.length) : 0;
  const pendingInput = useRef(null);
  const focusedFor = useRef(null);

  // Put the cursor in the new row, so that leaving it is a meaningful signal
  // that editing is done. The row only reaches this table once the jump to
  // the last page has happened, so this waits for it to actually be there.
  useEffect(() => {
    if (!pendingId) {
      focusedFor.current = null;
      return;
    }
    if (focusedFor.current === pendingId || !pendingInput.current) return;
    pendingInput.current.focus();
    focusedFor.current = pendingId;
  }, [pendingId, applications]);

  // Focus moving anywhere outside the row ends the edit; moving between the
  // row's own fields does not.
  function handlePendingBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) onCommitPending?.();
  }

  function handleSort(key) {
    if (sort.key === key) {
      onSortChange({ key, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ key, direction: 'asc' });
    }
  }

  return (
    <div className="table-wrap">
      <table className="tracker-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.key} scope="col">
                {col.sortable ? (
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => handleSort(col.key)}
                    aria-label={`Sort by ${col.label}`}
                  >
                    {col.label}
                    <SortArrow active={sort.key === col.key} direction={sort.direction} />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
            <th scope="col" className="col-actions">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {applications.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length + 1} className="empty-row">
                {emptyMessage}
              </td>
            </tr>
          )}

          {applications.map((app) => (
            <tr
              key={app.id}
              className={app.id === pendingId ? 'pending-row' : undefined}
              onBlur={app.id === pendingId ? handlePendingBlur : undefined}
            >
              <td>
                <input
                  ref={app.id === pendingId ? pendingInput : undefined}
                  className="cell-input cell-input--strong"
                  value={app.company}
                  placeholder="Company"
                  onChange={(e) => onUpdate(app.id, { company: e.target.value })}
                />
              </td>
              <td>
                <input
                  className="cell-input"
                  value={app.role}
                  placeholder="Role"
                  onChange={(e) => onUpdate(app.id, { role: e.target.value })}
                />
              </td>
              <td>
                <select
                  className={`status-select status--${app.status.toLowerCase().replace(/\s+/g, '-')}`}
                  value={app.status}
                  onChange={(e) => onUpdate(app.id, { status: e.target.value })}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <StarRating
                  value={app.priority}
                  onChange={(priority) => onUpdate(app.id, { priority })}
                  label={`Priority for ${app.company || 'this application'}`}
                />
              </td>
              <td>
                <input
                  className="cell-input cell-input--mono"
                  value={app.date}
                  placeholder="3 Aug 2026"
                  onChange={(e) => onUpdate(app.id, { date: e.target.value })}
                />
              </td>
              <td>
                <div className="url-cell">
                  <input
                    className="cell-input cell-input--mono"
                    value={app.jobPostingUrl}
                    placeholder="https://…"
                    onChange={(e) => onUpdate(app.id, { jobPostingUrl: e.target.value })}
                  />
                  <a
                    className={`icon-btn ${app.jobPostingUrl ? '' : 'icon-btn--disabled'}`}
                    href={app.jobPostingUrl || undefined}
                    target="_blank"
                    rel="noreferrer"
                    title="Open job posting"
                    aria-disabled={!app.jobPostingUrl}
                    tabIndex={app.jobPostingUrl ? 0 : -1}
                    onClick={(e) => {
                      if (!app.jobPostingUrl) e.preventDefault();
                    }}
                  >
                    ↗
                  </a>
                </div>
              </td>
              <td className="col-actions">
                <span
                  className={`doc-dot ${app.cv ? 'doc-dot--on' : ''}`}
                  title={app.cv ? `CV: ${app.cv.name}` : 'No CV attached'}
                >
                  CV
                </span>
                <span
                  className={`doc-dot ${app.coverLetter ? 'doc-dot--on' : ''}`}
                  title={
                    app.coverLetter
                      ? `Cover letter: ${app.coverLetter.name}`
                      : 'No cover letter attached'
                  }
                >
                  CL
                </span>
                <a
                  className="icon-btn"
                  title={`View details for ${app.company || 'this application'}`}
                  href={`#/app/${encodeURIComponent(app.id)}`}
                >
                  →
                </a>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  title={`Remove ${app.company || 'application'}`}
                  onClick={() => onRemove(app.id)}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}

          {/* A short last page would pull the pagination controls up the
              screen; pad it out so they stay put. */}
          {fillerRows > 0 &&
            Array.from({ length: fillerRows }, (_, index) => (
              <tr key={`filler-${index}`} className="filler-row" aria-hidden="true">
                <td colSpan={COLUMNS.length + 1} />
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
