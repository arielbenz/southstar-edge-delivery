/**
 * scripts/content/content-adapter-factory.js
 *
 * Returns the appropriate content adapter based on the current environment.
 *
 *  - __PREVIEW_SERVER (local dev): MockAdapter
 *  - Production / CDN:             SheetsAdapter
 */

import { MockAdapter } from './adapters/mock-adapter.js';
import { SheetsAdapter } from './adapters/sheets-adapter.js';

/**
 * @param {object} [options]
 * @param {object} [options.mocks]    Mock data map passed to MockAdapter.
 * @param {string} [options.baseUrl]  Base URL for SheetsAdapter.
 * @returns {import('./adapters/base-adapter.js').BaseContentAdapter}
 */
export function createContentAdapter({ mocks = {}, baseUrl } = {}) {
  if (typeof window !== 'undefined' && window.__PREVIEW_SERVER) {
    return new MockAdapter(mocks);
  }
  return new SheetsAdapter({ baseUrl });
}
