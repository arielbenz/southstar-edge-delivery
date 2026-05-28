import { useState } from 'react';
import PlanCard from './PlanCard.jsx';
import PlanFilter from './PlanFilter.jsx';
import { usePlansData } from '../usePlansData.js';

/**
 * Plans — root component for the gas plans block.
 * @param {{ plans: Array }} props — plans parsed from pre-rendered HTML
 */
export default function Plans({ plans: initialPlans }) {
  const [filter, setFilter] = useState('all');
  const { plans, loading, error } = usePlansData(initialPlans);

  if (loading) {
    return (
      <div
        className="plans plans--loading"
        aria-busy="true"
        aria-label="Loading plans"
      >
        <div className="plans__skeleton">
          {[1, 2, 3].map((i) => (
            <div key={i} className="plans__skeleton-card" aria-hidden="true" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plans plans--error" role="alert">
        <p className="plans__error-message">
          Unable to load plans. Please try again later.
        </p>
      </div>
    );
  }

  const filteredPlans = plans.filter((plan) => {
    if (filter === 'all') return true;
    if (filter === 'fixed')
      return plan.planName.toLowerCase().includes('fixed');
    if (filter === 'variable')
      return plan.planName.toLowerCase().includes('variable');
    return true;
  });

  return (
    <div className="plans">
      <PlanFilter activeFilter={filter} onFilterChange={setFilter} />
      <div className="plans__grid" role="list">
        {filteredPlans.length === 0 ? (
          <p className="plans__empty">No plans match the selected filter.</p>
        ) : (
          filteredPlans.map((plan) => <PlanCard key={plan.id} plan={plan} />)
        )}
      </div>
    </div>
  );
}
