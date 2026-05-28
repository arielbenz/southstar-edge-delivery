import { useState } from 'react';

const STATUS_LABELS = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
};

const STATUS_CLASSES = {
  ACTIVE: 'badge--success',
  COMPLETED: 'badge--neutral',
  CANCELLED: 'badge--error',
  PENDING: 'badge--warning',
};

function PlanItem({ plan }) {
  return (
    <li className="plan-list__item">
      <div className="plan-list__plan-header">
        <span className="plan-list__plan-name">{plan.name}</span>
        <span
          className={`badge ${STATUS_CLASSES[plan.status] ?? 'badge--neutral'}`}
        >
          {STATUS_LABELS[plan.status] ?? plan.status}
        </span>
      </div>
      <div className="plan-list__plan-details">
        {plan.rate && (
          <span className="plan-list__plan-rate">
            {plan.rate}
            ¢/CCF
          </span>
        )}
        {plan.startDate && (
          <span className="plan-list__plan-date">
            Since{' '}
            {new Date(plan.startDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>
    </li>
  );
}

/**
 * PlanList — lista de planes activos y pasados del usuario.
 */
export default function PlanList({ plans }) {
  const [pastExpanded, setPastExpanded] = useState(false);

  const activePlans = plans.filter((p) => p.status === 'ACTIVE');
  const pastPlans = plans.filter((p) => p.status !== 'ACTIVE');

  return (
    <section className="plan-list">
      <div className="plan-list__section">
        <h3 className="plan-list__section-heading">Current Plan</h3>
        {activePlans.length === 0 ? (
          <p className="plan-list__empty">No active plans.</p>
        ) : (
          <ul className="plan-list__list" aria-label="Active plans">
            {activePlans.map((plan) => (
              <PlanItem key={plan.id} plan={plan} />
            ))}
          </ul>
        )}
      </div>

      {pastPlans.length > 0 && (
        <div className="plan-list__section plan-list__section--past">
          <button
            type="button"
            className="plan-list__past-toggle"
            aria-expanded={pastExpanded}
            onClick={() => setPastExpanded((prev) => !prev)}
          >
            Past Plans ({pastPlans.length}) {pastExpanded ? '▲' : '▼'}
          </button>
          {pastExpanded && (
            <ul className="plan-list__list" aria-label="Past plans">
              {pastPlans.map((plan) => (
                <PlanItem key={plan.id} plan={plan} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
