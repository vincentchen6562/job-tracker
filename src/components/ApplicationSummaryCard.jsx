function statusClass(status) {
  return `status--${String(status).toLowerCase().replace(/\s+/g, '-')}`;
}

function StaticStars({ value = 0 }) {
  const levels = [1, 2, 3, 4, 5];
  return (
    <span className="stars stars--static" aria-label={`Priority ${value} of 5`}>
      {levels.map((level) => (
        <span key={level} className={`star ${level <= value ? 'star--on' : ''}`}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ApplicationSummaryCard({ app, onRemove, registerRef }) {
  const href = `#/app/${encodeURIComponent(app.id)}`;

  return (
    <article
      className="summary-card"
      id={`app-${app.id}`}
      ref={(node) => registerRef(app.id, node)}
    >
      <div className={`summary-card__spine ${statusClass(app.status)}`} aria-hidden="true" />

      <a className="summary-card__link" href={href}>
        <div className="summary-card__top">
          <div className="summary-card__identity">
            <h3 className="summary-card__company">{app.company || 'Untitled'}</h3>
            <p className="summary-card__role">{app.role || 'No role set'}</p>
          </div>
          <span className={`status-pill ${statusClass(app.status)}`}>{app.status}</span>
        </div>

        <div className="summary-card__meta">
          <StaticStars value={Number(app.priority) || 0} />
          <span className="summary-card__date">{app.date || 'No date'}</span>
        </div>

        {app.notes ? (
          <p className="summary-card__notes">{app.notes}</p>
        ) : (
          <p className="summary-card__notes summary-card__notes--empty">No summary yet.</p>
        )}
      </a>

      <div className="summary-card__footer">
        {app.jobPostingUrl ? (
          <a
            className="ghost-btn"
            href={app.jobPostingUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Open posting ↗
          </a>
        ) : (
          <span className="ghost-btn ghost-btn--disabled">No posting link</span>
        )}
        <a className="ghost-btn" href={href}>
          View details →
        </a>
        <button
          type="button"
          className="ghost-btn ghost-btn--danger"
          onClick={() => onRemove(app.id)}
        >
          Remove
        </button>
      </div>
    </article>
  );
}
