const FILTERS = [
  { id: 'all', label: 'All Plans' },
  { id: 'fixed', label: 'Fixed Rate' },
  { id: 'variable', label: 'Variable Rate' },
];

/**
 * PlanFilter — botones de filtro para el grid de planes.
 */
export default function PlanFilter({ activeFilter, onFilterChange }) {
  return (
    <div className="plan-filter" role="group" aria-label="Filter plans by type">
      {FILTERS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`plan-filter__btn${activeFilter === id ? ' plan-filter__btn--active' : ''}`}
          aria-pressed={activeFilter === id}
          onClick={() => onFilterChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
