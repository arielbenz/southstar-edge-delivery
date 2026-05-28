/**
 * Config Page Loader
 *
 * Load a EDS config page (e.g. /config/enrollment.plain.html) and parse its content
 * into a flat object of typed props.
 *
 * The author writes in the document:
 *   Key: Value
 * separated by optional sections (## section-name).
 *
 * The parser extracts all Key: Value pairs from any
 * section, normalizes them to camelCase, and casts the values.
 *
 * Usage:
 *   const config = await loadConfigPage('/config/enrollment')
 *   → { title: "...", termsRequired: true, minAge: 18, ... }
 */

/**
 * Converts "Support Phone" → "supportPhone"
 * Handles numbers: "Step 1 Title" → "step1Title"
 */
function toCamelCase(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Casts the value to the most likely type.
 * "true"/"false" → boolean
 * "18" / "3.5"   → number
 * rest            → string trimmed
 */
function castValue(val) {
  const trimmed = val.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') return num;
  return trimmed;
}

/**
 * Parses the HTML of a config page and returns a flat object.
 * Exported to allow direct testing without fetch.
 *
 * @param {string} html - HTML string from the .plain.html endpoint
 * @returns {Object}    - Config as a flat object with native types
 */
export function parseConfigPage(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const config = {};

  doc.querySelectorAll('p').forEach((p) => {
    const text = p.textContent.trim();
    const colonIdx = text.indexOf(':');

    // Ignore paragraphs without ":" or with ":" at the start/end
    if (colonIdx <= 0 || colonIdx === text.length - 1) return;

    const rawKey = text.slice(0, colonIdx).trim();
    const rawVal = text.slice(colonIdx + 1).trim();

    if (!rawKey || !rawVal) return;

    const key = toCamelCase(rawKey);
    if (!key) return;

    config[key] = castValue(rawVal);
  });

  return config;
}

/**
 * Loads an EDS config page via .plain.html
 * and returns the parsed config object.
 *
 * In ?mock=true mode, returns null so the component
 * can use its internal mocks.
 *
 * @param {string} path - Path of the page without extension
 *                        e.g., '/config/enrollment'
 * @returns {Promise<Object|null>}
 */
export async function loadConfigPage(path) {
  const isMock = new URLSearchParams(window.location.search).has('mock');
  if (isMock) return null;

  const url = `${path}.plain.html`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(
      `loadConfigPage: failed to load "${url}" → ${res.status} ${res.statusText}`,
    );
  }

  const html = await res.text();
  return parseConfigPage(html);
}
