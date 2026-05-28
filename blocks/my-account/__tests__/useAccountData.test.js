import { renderHook, waitFor } from '@testing-library/react';
import { useAccountData, mockUser, mockPlans } from '../useAccountData.js';

// NODE_ENV=test → IS_MOCK=true → mock data with 400ms delay

describe('useAccountData', () => {
  test('loading starts as true', () => {
    const { result } = renderHook(() => useAccountData('user-001'));
    expect(result.current.loading).toBe(true);
  });

  test('in mock mode returns correct data', async () => {
    const { result } = renderHook(() => useAccountData('user-001'));
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 1000 },
    );
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.plans).toEqual(mockPlans);
  });

  test('error is null when data loads successfully', async () => {
    const { result } = renderHook(() => useAccountData('user-001'));
    await waitFor(() => expect(result.current.loading).toBe(false), {
      timeout: 1000,
    });
    expect(result.current.error).toBeNull();
  });

  test('without userId does not load data and loading ends as false', async () => {
    const { result } = renderHook(() => useAccountData(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.plans).toEqual([]);
  });
});
