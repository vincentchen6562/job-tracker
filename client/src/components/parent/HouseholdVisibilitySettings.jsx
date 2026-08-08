const ALL_CATEGORIES = ['housing', 'food', 'transport', 'utilities', 'subscriptions', 'savings'];

export function HouseholdVisibilitySettings({ visibleCategories, onToggle }) {
  return (
    <div className="report">
      <h4>What can the teen see?</h4>
      <p className="sub">Choose which household categories are visible — full income and account balances stay hidden.</p>
      <div className="chips">
        {ALL_CATEGORIES.map((category) => (
          <button
            key={category}
            className="chip"
            style={{ opacity: visibleCategories.includes(category) ? 1 : 0.4 }}
            onClick={() => onToggle(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
