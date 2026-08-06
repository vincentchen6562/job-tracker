import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { STATUS_OPTIONS } from '../data/seedData';
import StarRating from '../components/StarRating';

function statusClass(status) {
  return `status--${String(status).toLowerCase().replace(/\s+/g, '-')}`;
}

export default function ApplicationDetailPage({ application, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    document.title = application
      ? `${application.company || 'Untitled'} · Application tracker`
      : 'Application not found · Application tracker';
  }, [application]);

  if (!application) {
    return (
      <div className="detail-page">
        <a className="back-link" href="#/">
          ← All applications
        </a>
        <div className="card">
          <p className="card__empty">
            Couldn't find that application — it may have been removed.
          </p>
          <a className="ghost-btn" href="#/">
            Back to all applications
          </a>
        </div>
      </div>
    );
  }

  const app = application;

  return (
    <div className="detail-page">
      <a className="back-link" href="#/">
        ← All applications
      </a>

      <article className="card card--detail">
        <div className={`card__spine ${statusClass(app.status)}`} aria-hidden="true" />

        <header className="card__head">
          <div className="card__identity">
            <input
              className="card__company"
              value={app.company}
              placeholder="Company"
              onChange={(e) => onUpdate(app.id, { company: e.target.value })}
            />
            <input
              className="card__role"
              value={app.role}
              placeholder="Role title"
              onChange={(e) => onUpdate(app.id, { role: e.target.value })}
            />
          </div>

          <div className="card__controls">
            <select
              className={`status-select ${statusClass(app.status)}`}
              value={app.status}
              onChange={(e) => onUpdate(app.id, { status: e.target.value })}
              aria-label="Status"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <StarRating
              value={app.priority}
              onChange={(priority) => onUpdate(app.id, { priority })}
              label={`Priority for ${app.company || 'this application'}`}
            />
          </div>
        </header>

        <div className="card__meta">
          <label className="meta-field">
            <span>Date</span>
            <input
              className="cell-input cell-input--mono"
              value={app.date}
              placeholder="3 Aug 2026"
              onChange={(e) => onUpdate(app.id, { date: e.target.value })}
            />
          </label>
          <label className="meta-field meta-field--wide">
            <span>Job posting</span>
            <input
              className="cell-input cell-input--mono"
              value={app.jobPostingUrl}
              placeholder="https://…"
              onChange={(e) => onUpdate(app.id, { jobPostingUrl: e.target.value })}
            />
          </label>
        </div>

        <label className="meta-field meta-field--full">
          <span>Summary</span>
          <input
            className="cell-input"
            value={app.notes}
            placeholder="One line you'll see on the summary card"
            onChange={(e) => onUpdate(app.id, { notes: e.target.value })}
          />
        </label>

        <div className="card__toolbar">
          <button type="button" className="ghost-btn" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Done editing' : 'Edit notes'}
          </button>
          {app.jobPostingUrl && (
            <a
              className="ghost-btn"
              href={app.jobPostingUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open posting ↗
            </a>
          )}
          <button
            type="button"
            className="ghost-btn ghost-btn--danger"
            onClick={() => onRemove(app.id)}
          >
            Remove
          </button>
        </div>

        <div className="card__body">
          {editing ? (
            <textarea
              className="detail-editor"
              value={app.detail}
              placeholder="Markdown notes — headings, tables, lists all work."
              onChange={(e) => onUpdate(app.id, { detail: e.target.value })}
              rows={18}
            />
          ) : app.detail?.trim() ? (
            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{app.detail}</ReactMarkdown>
            </div>
          ) : (
            <p className="card__empty">
              No notes yet. Choose “Edit notes” to write them in markdown.
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
