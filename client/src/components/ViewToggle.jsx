const VIEWS = [
  {
    id: 'table',
    label: 'Table view',
    icon: (
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
        <line x1="1.5" y1="6" x2="14.5" y2="6" />
        <line x1="1.5" y1="9.5" x2="14.5" y2="9.5" />
        <line x1="6" y1="6" x2="6" y2="13.5" />
      </svg>
    ),
  },
  {
    id: 'cards',
    label: 'Card view',
    icon: (
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
        <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" />
        <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" />
        <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
      </svg>
    ),
  },
];

export default function ViewToggle({ view, onChange }) {
  return (
    <div className="view-toggle" role="group" aria-label="Layout">
      {VIEWS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`view-toggle__btn ${view === option.id ? 'view-toggle__btn--on' : ''}`}
          aria-pressed={view === option.id}
          title={option.label}
          onClick={() => onChange(option.id)}
        >
          {option.icon}
          <span className="visually-hidden">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
