const LABELS = {
  saving: 'Saving…',
  saved: 'Saved',
  failed: "Couldn't save",
};

// Whether the latest edits have reached the server, with a way to send them
// again when they haven't.
export default function SaveStatus({ status, onRetry }) {
  return (
    <span className={`save-status save-status--${status}`} role="status" aria-live="polite">
      {LABELS[status]}
      {status === 'failed' && (
        <button type="button" className="btn btn--quiet save-status__retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </span>
  );
}
