import { useRef } from 'react';

// A button that picks a backup file and hands it to `onRestore`. The file
// input itself is hidden, since it can't be styled like the other buttons.
// `busy` covers any replacement of the whole list, `restoring` only this
// one's, so a reset to the seed data disables the button without claiming a
// backup is being restored.
export default function RestoreBackupButton({ onRestore, restoring, busy = restoring }) {
  const fileInput = useRef(null);

  function handleFile(event) {
    const file = event.target.files?.[0];
    // Cleared so picking the same file again still fires `change`.
    event.target.value = '';
    if (file) onRestore(file);
  }

  return (
    <>
      <button
        type="button"
        className="btn"
        disabled={busy}
        onClick={() => fileInput.current?.click()}
      >
        {restoring ? 'Restoring…' : 'Restore backup'}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        hidden
      />
    </>
  );
}
