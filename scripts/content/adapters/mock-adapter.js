/**
 * scripts/content/adapters/mock-adapter.js
 *
 * Returns hardcoded mock data for local development and testing.
 * Mock data files live in scripts/content/mocks/ as JSON files.
 */

import { BaseContentAdapter } from './base-adapter.js';

export class MockAdapter extends BaseContentAdapter {
  constructor(mocks = {}) {
    super();
    /** @type {Record<string, object>} */
    this._mocks = mocks;
  }

  async fetchCollection(path) {
    const data = this._mocks[path];
    if (!data) return [];
    return Array.isArray(data) ? data : (data.data ?? []);
  }

  async fetchItem(path) {
    const data = this._mocks[path];
    if (!data) return null;
    return Array.isArray(data) ? (data[0] ?? null) : data;
  }

  async fetchFragment(path) {
    const data = this._mocks[path];
    return typeof data === 'string' ? data : '';
  }
}
