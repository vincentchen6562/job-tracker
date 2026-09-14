import { useRef } from 'react';
import ViewToggle from './ViewToggle';

export default function Toolbar({
  onAdd,
  onExportMarkdown,
  onExportJson,
  onImportJson,
  onReset,
  view,
  onViewChange,
}) {
  const fileInput = useRef(null);

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImportJson(String(reader.result));
    reader.onerror = () => onImportJson(null);
    reader.readAsText(file);
    event.target.value = '';
  }

  return (
    <div className="toolbar">
      <div className="toolbar__group">
        <button type="button" className="btn btn--primary" onClick={onAdd}>
          Add application
        </button>
        <ViewToggle view={view} onChange={onViewChange} />
      </div>

      <div className="toolbar__group">
        <button type="button" className="btn" onClick={onExportMarkdown}>
          Download markdown
        </button>
        <button type="button" className="btn" onClick={onExportJson}>
          Download backup
        </button>
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
          Restore backup
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          hidden
        />
        <button type="button" className="btn btn--quiet" onClick={onReset}>
          Reset to seed data
        </button>
      </div>
    </div>
  );
}
