/**
 * scripts/content/adapters/base-adapter.js
 *
 * Abstract base class for content adapters.
 * Concrete adapters implement fetchCollection() and fetchItem().
 */

export class BaseContentAdapter {
  /**
   * Fetch a list of items from a data source.
   * @param {string} _path  Resource path (e.g. "/plans.json")
   * @returns {Promise<Array<object>>}
   */
  // eslint-disable-next-line no-unused-vars
  async fetchCollection(_path) {
    throw new Error('fetchCollection() must be implemented by subclass');
  }

  /**
   * Fetch a single item from a data source.
   * @param {string} _path  Resource path
   * @returns {Promise<object|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async fetchItem(_path) {
    throw new Error('fetchItem() must be implemented by subclass');
  }

  /**
   * Fetch raw HTML fragment content.
   * @param {string} _path  Fragment path
   * @returns {Promise<string>}
   */
  // eslint-disable-next-line no-unused-vars
  async fetchFragment(_path) {
    throw new Error('fetchFragment() must be implemented by subclass');
  }
}
