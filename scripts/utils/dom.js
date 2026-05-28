/**
 * scripts/utils/dom.js
 *
 * DOM helpers with compatibility for Sidekick Library (iframe srcdoc)
 */

/**
 * Returns the correct origin for both normal pages and iframe srcdoc.
 * @returns {string}
 */
export function getOrigin() {
  const { location } = window;
  return location.href === 'about:srcdoc'
    ? window.parent.location.origin
    : location.origin;
}

/**
 * Returns the full href for both normal pages and iframe srcdoc.
 * @returns {string}
 */
export function getHref() {
  if (window.location.href !== 'about:srcdoc') return window.location.href;
  const { location: parentLocation } = window.parent;
  const urlParams = new URLSearchParams(parentLocation.search);
  return `${parentLocation.origin}${urlParams.get('path')}`;
}

/**
 * Creates an element with optional classes and attributes.
 * @param {string} tag
 * @param {string[]} classes
 * @param {Object} attributes
 * @returns {HTMLElement}
 */
export function createElement(tag, classes = [], attributes = {}) {
  const el = document.createElement(tag);
  if (classes.length) el.classList.add(...classes);
  Object.entries(attributes).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });
  return el;
}

/**
 * Reads the content of a meta tag by name or property.
 * @param {string} name
 * @returns {string}
 */
export function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = document.head.querySelector(`meta[${attr}="${name}"]`);
  return meta ? meta.content : '';
}

/**
 * @returns {boolean} true if the viewport is mobile (<768px)
 */
export function isMobile() {
  return window.innerWidth < 768;
}

/**
 * @returns {boolean} true if the viewport is tablet (768px–1023px)
 */
export function isTablet() {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}
