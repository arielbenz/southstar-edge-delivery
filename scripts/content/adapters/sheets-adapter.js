/**
 * scripts/content/adapters/sheets-adapter.js
 *
 * Reads EDS spreadsheet JSON endpoints (/*.json) from the live site.
 * EDS exports Google Sheets as JSON: { total, offset, limit, data: [...] }
 */

import { BaseContentAdapter } from './base-adapter.js';

export class SheetsAdapter extends BaseContentAdapter {
  /**
   * @param {object} [options]
   * @param {string} [options.baseUrl]  Origin for relative paths. Defaults to window.location.origin.
   */
  constructor({ baseUrl } = {}) {
    super();
    this._baseUrl =
      baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');
  }

  async fetchCollection(path) {
    const url = path.startsWith('http') ? path : `${this._baseUrl}${path}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SheetsAdapter: ${res.status} ${url}`);
    const json = await res.json();
    return json.data ?? json;
  }

  async fetchItem(path) {
    const collection = await this.fetchCollection(path);
    return collection[0] ?? null;
  }

  async fetchFragment(path) {
    const url = path.startsWith('http') ? path : `${this._baseUrl}${path}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SheetsAdapter: ${res.status} ${url}`);
    return res.text();
  }
}
