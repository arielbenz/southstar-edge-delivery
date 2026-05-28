import { useEffect, useState } from 'react';
import { loadConfigPage } from '../../scripts/utils/config-page-loader.js';
import schema from './_enrollment-flow.json' assert { type: 'json' };

export const mockEnrollmentConfig = schema.mock._mockConfig;

function getSearchParams() {
  if (typeof window === 'undefined') {
    return new URLSearchParams('');
  }

  return new URLSearchParams(window.location.search);
}

export function useEnrollmentConfig(configPath = '/config/enrollment') {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;
    const params = getSearchParams();
    const isMock = params.has('mock');
    const shouldError = params.get('error') === 'true';

    setLoading(true);
    setError(null);

    if (isMock) {
      if (shouldError) {
        setConfig(null);
        setError(new Error('Mock enrollment config error'));
        setLoading(false);
        return () => {
          isActive = false;
        };
      }

      setConfig(mockEnrollmentConfig);
      setLoading(false);
      return () => {
        isActive = false;
      };
    }

    (async () => {
      try {
        const nextConfig = await loadConfigPage(configPath);
        if (!isActive) return;
        setConfig(nextConfig);
      } catch (err) {
        if (!isActive) return;
        setConfig(null);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [configPath]);

  return { config, loading, error };
}
