/**
 * tests/unit/brand-config.test.js
 *
 * Unit tests for scripts/utils/brand-config.js
 * Runs in vitest with jsdom environment.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Module under test ──────────────────────────────────────────────────────
// We need to control window.location and document, so we import after setting
// up the environment.
import {
  detectBrand,
  isValidBrand,
  applyBrandClass,
} from '../../scripts/utils/brand-config.js';

// ── Helpers ────────────────────────────────────────────────────────────────
function setLocation({ hostname = 'localhost', search = '' } = {}) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { hostname, search, href: `http://${hostname}/${search}` },
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('detectBrand()', () => {
  beforeEach(() => {
    // Clean body/html classes between tests
    document.body.className = '';
    document.documentElement.removeAttribute('data-brand');
  });

  it('returns "southstar" by default (no param, unknown host)', () => {
    setLocation({ hostname: 'localhost', search: '' });
    expect(detectBrand()).toBe('southstar');
  });

  it('reads ?brand=gng from the URL search params', () => {
    setLocation({ hostname: 'localhost', search: '?brand=gng' });
    expect(detectBrand()).toBe('gng');
  });

  it('detects gng.com from hostname', () => {
    setLocation({ hostname: 'gng.com', search: '' });
    expect(detectBrand()).toBe('gng');
  });

  it('detects southstarenergy.com from hostname', () => {
    setLocation({ hostname: 'southstarenergy.com', search: '' });
    expect(detectBrand()).toBe('southstar');
  });
});

describe('isValidBrand()', () => {
  it('returns true for "gng"', () => {
    expect(isValidBrand('gng')).toBe(true);
  });

  it('returns false for "unknown-brand"', () => {
    expect(isValidBrand('unknown-brand')).toBe(false);
  });

  it('returns true for all known brands', () => {
    expect(isValidBrand('southstar')).toBe(true);
    expect(isValidBrand('ong')).toBe(true);
    expect(isValidBrand('grand-rapids')).toBe(true);
  });
});

describe('applyBrandClass()', () => {
  beforeEach(() => {
    document.body.className = '';
    document.documentElement.removeAttribute('data-brand');
  });

  it('adds "brand-gng" class to document.body', () => {
    applyBrandClass('gng');
    expect(document.body.classList.contains('brand-gng')).toBe(true);
  });

  it('sets data-brand="gng" on the html element', () => {
    applyBrandClass('gng');
    expect(document.documentElement.getAttribute('data-brand')).toBe('gng');
  });
});
