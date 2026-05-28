import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import {
  mockEnrollmentConfig,
  useEnrollmentConfig,
} from '../useEnrollmentConfig.js';

const loaderMocks = vi.hoisted(() => ({
  loadConfigPage: vi.fn(),
}));

vi.mock('../../../scripts/utils/config-page-loader.js', () => ({
  loadConfigPage: loaderMocks.loadConfigPage,
}));

describe('useEnrollmentConfig', () => {
  beforeEach(() => {
    loaderMocks.loadConfigPage.mockReset();
    window.history.replaceState({}, '', '/');
  });

  test('devuelve loading=true inicialmente', () => {
    loaderMocks.loadConfigPage.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() =>
      useEnrollmentConfig('/config/enrollment'),
    );
    expect(result.current.loading).toBe(true);
  });

  test('devuelve la config cuando loadConfigPage resuelve', async () => {
    loaderMocks.loadConfigPage.mockResolvedValue({ title: 'Enroll in Ohio' });
    const { result } = renderHook(() =>
      useEnrollmentConfig('/config/enrollment'),
    );

    await waitFor(() =>
      expect(result.current.config).toEqual({ title: 'Enroll in Ohio' }),
    );
    expect(result.current.error).toBeNull();
  });

  test('devuelve error cuando loadConfigPage rechaza', async () => {
    loaderMocks.loadConfigPage.mockRejectedValue(new Error('API Error'));
    const { result } = renderHook(() =>
      useEnrollmentConfig('/config/enrollment'),
    );

    await waitFor(() =>
      expect(result.current.error?.message).toBe('API Error'),
    );
    expect(result.current.config).toBeNull();
  });

  test('en modo mock devuelve el mockConfig sin llamar a fetch', async () => {
    window.history.replaceState({}, '', '/?mock=true');
    const { result } = renderHook(() =>
      useEnrollmentConfig('/config/enrollment'),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.config).toEqual(mockEnrollmentConfig);
    expect(loaderMocks.loadConfigPage).not.toHaveBeenCalled();
  });

  test('en modo mock con ?error=true devuelve error', async () => {
    window.history.replaceState({}, '', '/?mock=true&error=true');
    const { result } = renderHook(() =>
      useEnrollmentConfig('/config/enrollment'),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('Mock enrollment config error');
    expect(loaderMocks.loadConfigPage).not.toHaveBeenCalled();
  });

  test('loading pasa a false despues de resolver', async () => {
    loaderMocks.loadConfigPage.mockResolvedValue({ title: 'Enroll in Ohio' });
    const { result } = renderHook(() =>
      useEnrollmentConfig('/config/enrollment'),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  test('loading pasa a false despues de rechazar', async () => {
    loaderMocks.loadConfigPage.mockRejectedValue(new Error('API Error'));
    const { result } = renderHook(() =>
      useEnrollmentConfig('/config/enrollment'),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
