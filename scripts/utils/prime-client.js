/**
 * scripts/utils/prime-client.js
 *
 * Cliente base para la API de Adobe Learning Manager (PRIME).
 * El cliente es stateless — el token viene de auth.js.
 */

import { getAuthToken } from './auth.js';

const PRIME_BASE_URL = 'https://learningmanager.adobe.com/primeapi/v2';

/**
 * Construye los headers comunes para todas las requests.
 * @returns {HeadersInit}
 */
function buildHeaders() {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `oauth ${token}`;
  }
  return headers;
}

/**
 * Manejo de errores HTTP centralizado.
 * @param {Response} response
 */
async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`PRIME API error ${response.status}: ${text}`);
  }
  return response.json();
}

/**
 * Crea un cliente para la API de PRIME.
 * @returns {{ get: Function, post: Function }}
 */
export function createPrimeClient() {
  return {
    /**
     * GET request a la PRIME API.
     * @param {string} path - ruta relativa, ej: '/users/123'
     * @returns {Promise<Object>}
     */
    async get(path) {
      const response = await fetch(`${PRIME_BASE_URL}${path}`, {
        method: 'GET',
        headers: buildHeaders(),
      });
      return handleResponse(response);
    },

    /**
     * POST request a la PRIME API.
     * @param {string} path - ruta relativa
     * @param {Object} body - payload JSON
     * @returns {Promise<Object>}
     */
    async post(path, body) {
      const response = await fetch(`${PRIME_BASE_URL}${path}`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(response);
    },
  };
}

// ---------------------------------------------------------------------------
// Normalizadores — traducen el shape de PRIME al shape del proyecto
// ---------------------------------------------------------------------------

/**
 * Normaliza un objeto usuario de PRIME al shape interno.
 * @param {Object} primeUser - respuesta de /users/{id}
 * @returns {{ id, name, email, avatarUrl }}
 */
export function normalizeUser(primeUser) {
  const { id, attributes } = primeUser?.data ?? {};
  return {
    id: id ?? null,
    name: attributes?.name ?? '',
    email: attributes?.email ?? '',
    avatarUrl: attributes?.avatarUrl ?? null,
  };
}

/**
 * Normaliza un enrollment individual de PRIME al shape de plan.
 * @param {Object} primeEnrollment - item de /enrollments
 * @returns {{ id, name, rate, term, status, startDate }}
 */
export function normalizePlan(primeEnrollment) {
  const { id, attributes, relationships } = primeEnrollment ?? {};
  return {
    id: id ?? null,
    name:
      relationships?.learningObject?.data?.attributes?.localizedMetadata?.[0]
        ?.name ?? '',
    rate: attributes?.price ?? 0,
    term: attributes?.completionDeadline ?? null,
    status: attributes?.state ?? 'UNKNOWN',
    startDate: attributes?.dateEnrolled ?? null,
  };
}

/**
 * Normaliza una lista de enrollments de PRIME.
 * @param {Object} primeData - respuesta de /enrollments
 * @returns {Array}
 */
export function normalizePlanList(primeData) {
  const items = primeData?.data ?? [];
  return items.map(normalizePlan);
}
