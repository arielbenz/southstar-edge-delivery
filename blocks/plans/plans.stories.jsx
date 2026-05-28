import Plans from './components/Plans.jsx';
import { mockPlans } from './usePlansData.js';

export default {
  title: 'Blocks/Plans',
  component: Plans,
};

export const Default = {
  args: {
    plans: mockPlans,
  },
};

export const OnlyFixed = {
  args: {
    plans: mockPlans.filter((p) => p.planName.toLowerCase().includes('fixed')),
  },
};

export const Loading = {
  render: () => (
    <div className="plans plans--loading" aria-busy="true">
      <div className="plans__skeleton">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="plans__skeleton-card"
            style={{ height: '280px', background: '#eee', borderRadius: '8px' }}
          />
        ))}
      </div>
    </div>
  ),
};

export const Error = {
  render: () => (
    <div className="plans plans--error" role="alert">
      <p className="plans__error-message">
        Unable to load plans. Please try again later.
      </p>
    </div>
  ),
};
