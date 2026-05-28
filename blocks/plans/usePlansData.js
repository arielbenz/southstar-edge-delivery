import { useState, useEffect } from 'react';

const IS_MOCK =
  new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : '',
  ).has('mock') ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test');

export const mockPlans = [
  {
    id: 'plan-fixed-12',
    planName: 'Fixed Rate 12-Month',
    rate: '52.9',
    term: '12',
    featuresHtml:
      '<ul><li>Locked-in rate for 12 months</li><li>No enrollment fee</li><li>Budget certainty</li></ul>',
    featured: false,
  },
  {
    id: 'plan-fixed-24',
    planName: 'Fixed Rate 24-Month',
    rate: '54.5',
    term: '24',
    featuresHtml:
      '<ul><li>Locked-in rate for 24 months</li><li>No enrollment fee</li><li>Maximum budget certainty</li><li>Price protection through two winters</li></ul>',
    featured: true,
  },
  {
    id: 'plan-variable',
    planName: 'Variable Rate Monthly',
    rate: '49.1',
    term: '1',
    featuresHtml:
      '<ul><li>Month-to-month flexibility</li><li>No long-term commitment</li><li>Cancel anytime</li></ul>',
    featured: false,
  },
];

/**
 * usePlansData — hook that abstracts the plans data source.
 * In mock/test mode returns static data.
 * In production, calls the real API (placeholder).
 *
 * @param {Array} initialPlans — plans parsed from the HTML (SSR)
 */
export function usePlansData(initialPlans = []) {
  const [plans, setPlans] = useState(initialPlans.length ? initialPlans : null);
  const [loading, setLoading] = useState(!initialPlans.length);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If we already have data from the pre-rendered HTML, skip the fetch
    if (initialPlans.length) {
      setPlans(initialPlans);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (IS_MOCK) {
      setPlans(mockPlans);
      setLoading(false);
      return;
    }

    // Production: real fetch (placeholder)
    (async () => {
      try {
        // TODO: replace with real endpoint when available
        const response = await fetch('/api/plans');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setPlans(data);
      } catch (err) {
        setError(err.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { plans: plans ?? [], loading, error };
}
