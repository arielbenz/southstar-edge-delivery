import { useState, useEffect } from 'react';
import {
  createPrimeClient,
  normalizeUser,
  normalizePlanList,
} from '../../scripts/utils/prime-client.js';

const IS_MOCK =
  new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : '',
  ).has('mock') ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
  // __STORYBOOK_ADDONS_CHANNEL__ is always present in the Storybook preview iframe
  (typeof window !== 'undefined' &&
    window.__STORYBOOK_ADDONS_CHANNEL__ != null);

export const mockUser = {
  id: 'user-001',
  name: 'Jane Martinez',
  email: 'jane.martinez@example.com',
  avatarUrl: null,
};

export const mockPlans = [
  {
    id: 'enroll-001',
    name: 'Fixed Rate 24-Month',
    rate: '54.5',
    term: '24',
    status: 'ACTIVE',
    startDate: '2024-11-01T00:00:00Z',
  },
  {
    id: 'enroll-000',
    name: 'Variable Rate Monthly',
    rate: '49.1',
    term: '1',
    status: 'COMPLETED',
    startDate: '2024-01-01T00:00:00Z',
  },
];

/**
 * useAccountData — hook that fetches the user profile and their plans.
 * @param {string} userId
 */
export function useAccountData(userId) {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (IS_MOCK) {
      // Simulate a 400ms network delay
      const timer = setTimeout(() => {
        setUser(mockUser);
        setPlans(mockPlans);
        setLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }

    // Production: calls the PRIME API
    const client = createPrimeClient();
    (async () => {
      try {
        const [userResp, plansResp] = await Promise.all([
          client.get(`/users/${userId}`),
          client.get(`/users/${userId}/enrollments?include=learningObject`),
        ]);
        setUser(normalizeUser(userResp));
        setPlans(normalizePlanList(plansResp));
      } catch (err) {
        setError(err.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();

    return undefined;
  }, [userId]);

  return { user, plans, loading, error };
}
