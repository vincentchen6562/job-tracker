import RestoreBackupButton from './RestoreBackupButton';
import ViewToggle from './ViewToggle';

// `onResetToSeed` is only given for a demo account, which is the only kind
// with seed data to go back to (ADR-0005). `replacing` names the replacement
// of the whole list that is under way, if any.
export default function Toolbar({
  onAdd,
  onExportMarkdown,
  onExportJson,
  onRestore,
  onResetToSeed,
  replacing,
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
        <RestoreBackupButton
          onRestore={onRestore}
          restoring={replacing === 'backup'}
          busy={replacing !== null}
        />
        {onResetToSeed && (
          <button
            type="button"
            className="btn"
            onClick={onResetToSeed}
            disabled={replacing !== null}
          >
            {replacing === 'seed data' ? 'Resetting…' : 'Reset to seed data'}
          </button>
        )}
      </div>
    </div>
  );
}
