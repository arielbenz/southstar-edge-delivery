/**
 * scripts/utils/auth.js
 *
 * Centralizes how the session token is obtained for the PRIME API.
 *
 * Current strategy:
 *   - The token is injected into meta tags by the server during SSR/CDN edge.
 *
 * Future strategy:
 *   - AEM session token or authentication cookie.
 */

/**
 * Returns the auth token for the PRIME API.
 * @returns {string|null}
 */
export function getAuthToken() {
  return document.querySelector('meta[name="prime-token"]')?.content || null;
}

/**
 * Returns the userId of the current session.
 * @returns {string|null}
 */
export function getUserId() {
  return document.querySelector('meta[name="user-id"]')?.content || null;
}

/**
 * Returns whether the user is authenticated (has both token and userId).
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!getAuthToken() && !!getUserId();
}
