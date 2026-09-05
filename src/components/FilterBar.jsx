import {
  CATEGORY_OPTIONS,
  ROLE_TYPE_OPTIONS,
  LOCATION_OPTIONS,
  UNSPECIFIED,
} from '../data/taxonomy';

const PRIORITY_OPTIONS = [
  { value: '5', label: '★★★★★' },
  { value: '4', label: '★★★★☆' },
  { value: '3', label: '★★★☆☆' },
  { value: '2', label: '★★☆☆☆' },
  { value: '1', label: '★☆☆☆☆' },
  { value: '0', label: 'Unrated' },
];

// Only offer values that actually exist in the tracker, so the dropdowns stay
// short. The current selection is always kept, even at zero, so the control
// never silently drops the thing you filtered by.
function usable(options, counts, selected) {
  return options.filter((option) => counts[option] > 0 || option === selected);
}

function FacetSelect({ id, label, value, onChange, options, counts }) {
  return (
    <label className="filter-field" htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        className={`filter-select ${value !== 'all' ? 'filter-select--on' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {counts[option.value] ? ` (${counts[option.value]})` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function FilterBar({
  query,
  onQueryChange,
  filters,
  onFilterChange,
  onClear,
  counts,
  shown,
  total,
}) {
  const active =
    query.trim() !== '' || Object.values(filters).some((value) => value !== 'all');

  const asOptions = (values) => values.map((value) => ({ value, label: value }));

  // Locations are free text, so anything typed into a role's tag box has to
  // show up here too — not just the premade centres.
  const locationOptions = [
    ...LOCATION_OPTIONS.filter((option) => option !== UNSPECIFIED),
    ...Object.keys(counts.location)
      .filter((name) => !LOCATION_OPTIONS.includes(name))
      .sort((a, b) => a.localeCompare(b)),
    UNSPECIFIED,
  ];

  return (
    <div className="filter-bar">
      <div className="filter-bar__search">
        <span className="filter-bar__search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          id="tracker-search"
          type="search"
          className="filter-bar__input"
          value={query}
          placeholder="Search company, role, notes, details…"
          aria-label="Search applications"
          onChange={(e) => onQueryChange(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="icon-btn filter-bar__clear-search"
            title="Clear search"
            aria-label="Clear search"
            onClick={() => onQueryChange('')}
          >
            ✕
          </button>
        )}
      </div>

      <div className="filter-bar__filters">
        <FacetSelect
          id="filter-category"
          label="Category"
          value={filters.category}
          onChange={(value) => onFilterChange({ category: value })}
          options={asOptions(usable(CATEGORY_OPTIONS, counts.category, filters.category))}
          counts={counts.category}
        />
        <FacetSelect
          id="filter-role-type"
          label="Role type"
          value={filters.roleType}
          onChange={(value) => onFilterChange({ roleType: value })}
          options={asOptions(usable(ROLE_TYPE_OPTIONS, counts.roleType, filters.roleType))}
          counts={counts.roleType}
        />
        <FacetSelect
          id="filter-location"
          label="Location"
          value={filters.location}
          onChange={(value) => onFilterChange({ location: value })}
          options={asOptions(usable(locationOptions, counts.location, filters.location))}
          counts={counts.location}
        />
        <FacetSelect
          id="filter-priority"
          label="Priority"
          value={filters.priority}
          onChange={(value) => onFilterChange({ priority: value })}
          options={PRIORITY_OPTIONS.filter(
            (option) => counts.priority[option.value] > 0 || option.value === filters.priority
          )}
          counts={counts.priority}
        />

        <div className="filter-bar__status">
          <span className="filter-bar__count">
            {active ? `Showing ${shown} of ${total}` : `${total} ${total === 1 ? 'application' : 'applications'}`}
          </span>
          {active && (
            <button type="button" className="btn btn--quiet" onClick={onClear}>
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
