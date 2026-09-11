import { useRef, useState } from 'react';
import {
  ACCEPT_ATTR,
  describeFile,
  formatBytes,
  putFile,
  deleteFile,
  openFile,
} from '../utils/fileStore';

// One slot — a CV or a cover letter. The record holds only the metadata
// stub; the bytes live in IndexedDB under meta.id. See utils/fileStore.js.
export default function AttachmentField({ label, meta, onChange, onError }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    // Allows re-picking the same file after a removal.
    event.target.value = '';
    if (!file) return;

    const verdict = describeFile(file);
    if (!verdict.ok) {
      onError(verdict.reason);
      return;
    }

    setBusy(true);
    try {
      const stored = await putFile(file);
      // Replacing: drop the old blob once the new one is safely written.
      if (meta?.id) await deleteFile(meta.id).catch(() => {});
      onChange(stored);
    } catch (error) {
      onError(`Couldn't save that file — ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleOpen() {
    try {
      await openFile(meta);
    } catch (error) {
      onError(error.message);
    }
  }

  async function handleRemove() {
    if (!window.confirm(`Remove ${meta.name}?`)) return;
    setBusy(true);
    try {
      await deleteFile(meta.id);
      onChange(null);
    } catch (error) {
      onError(`Couldn't remove that file — ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="attachment">
      <span className="attachment__label">{label}</span>

      {meta ? (
        <div className="attachment__file">
          <button
            type="button"
            className="attachment__name"
            onClick={handleOpen}
            title={`Open ${meta.name}`}
          >
            <span className="attachment__icon" aria-hidden="true">
              ▤
            </span>
            <span className="attachment__filename">{meta.name}</span>
          </button>
          <span className="attachment__size">{formatBytes(meta.size)}</span>
          <button
            type="button"
            className="ghost-btn ghost-btn--tiny"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            Replace
          </button>
          <button
            type="button"
            className="ghost-btn ghost-btn--tiny ghost-btn--danger"
            onClick={handleRemove}
            disabled={busy}
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="attachment__drop"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? 'Saving…' : `+ Attach ${label.toLowerCase()}`}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        onChange={handleFile}
        hidden
      />
    </div>
  );
}
