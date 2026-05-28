/**
 * scripts/content/use-content.js
 *
 * React hooks for consuming content via the active ContentAdapter.
 * These hooks are environment-agnostic; they delegate to whatever adapter
 * createContentAdapter() returns.
 *
 * Usage:
 *   import { useCollection, useItem, useFragment } from '../../scripts/content/use-content.js';
 *   const { data, loading, error } = useCollection('/plans.json');
 */

import { useState, useEffect } from 'react';
import { createContentAdapter } from './content-adapter-factory.js';

const adapter = createContentAdapter();

/**
 * Fetch a collection of items from the given path.
 * @param {string} path
 * @returns {{ data: Array<object>, loading: boolean, error: Error|null }}
 */
export function useCollection(path) {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ data: [], loading: true, error: null });
    adapter
      .fetchCollection(path)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: [], loading: false, error });
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}

/**
 * Fetch a single item from the given path.
 * @param {string} path
 * @returns {{ data: object|null, loading: boolean, error: Error|null }}
 */
export function useItem(path) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    adapter
      .fetchItem(path)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}

/**
 * Fetch raw HTML fragment content.
 * @param {string} path
 * @returns {{ html: string, loading: boolean, error: Error|null }}
 */
export function useFragment(path) {
  const [state, setState] = useState({ html: '', loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ html: '', loading: true, error: null });
    adapter
      .fetchFragment(path)
      .then((html) => {
        if (!cancelled) setState({ html, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ html: '', loading: false, error });
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
