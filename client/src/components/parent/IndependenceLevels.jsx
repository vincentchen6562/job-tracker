const LEVELS = [
  { level: 1, items: ['Pocket money', 'Savings', 'Entertainment'] },
  { level: 2, items: ['Phone plan', 'Transport', 'Lunch'] },
  { level: 3, items: ['Groceries', 'Subscriptions', 'Larger weekly budget'] },
];

export function IndependenceLevels({ currentLevel, onChangeLevel }) {
  return (
    <div className="report">
      <h4>Graduated independence</h4>
      {LEVELS.map((l) => (
        <div className="summary-row" key={l.level}>
          <span>
            Level {l.level}: {l.items.join(', ')}
          </span>
          {onChangeLevel && (
            <button
              className={l.level === currentLevel ? 'btn primary' : 'btn secondary'}
              onClick={() => onChangeLevel(l.level)}
            >
              {l.level === currentLevel ? 'Current' : 'Set'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
