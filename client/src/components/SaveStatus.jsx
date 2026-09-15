const LABELS = {
  saving: 'Saving…',
  saved: 'Saved',
  failed: "Couldn't save",
};

// A small picture of each state, so it reads at a glance: a spinner while
// saving, a tick once saved, a warning when a save failed.
function StatusIcon({ status }) {
  if (status === 'saving') {
    return (
      <svg
        className="save-status__icon save-status__spinner"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <circle className="save-status__track" cx="8" cy="8" r="6" />
        <path d="M14 8a6 6 0 0 0-6-6" />
      </svg>
    );
  }
  if (status === 'failed') {
    return (
      <svg className="save-status__icon" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 4.75v3.75M8 11.25v.01" />
      </svg>
    );
  }
  return (
    <svg className="save-status__icon" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5.25 8.25l1.9 1.9 3.6-3.9" />
    </svg>
  );
}

// Whether the latest edits have reached the server, with a way to send them
// again when they haven't.
export default function SaveStatus({ status, onRetry }) {
  return (
    <span className={`save-status save-status--${status}`} role="status" aria-live="polite">
      <StatusIcon status={status} />
      {LABELS[status]}
      {status === 'failed' && (
        <button type="button" className="btn btn--quiet save-status__retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </span>
  );
}
