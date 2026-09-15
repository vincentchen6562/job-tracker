import RestoreBackupButton from './RestoreBackupButton';
import ViewToggle from './ViewToggle';

export default function Toolbar({
  onAdd,
  onExportMarkdown,
  onExportJson,
  onRestore,
  restoring,
  view,
  onViewChange,
}) {
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
        <RestoreBackupButton onRestore={onRestore} restoring={restoring} />
      </div>
    </div>
  );
}
