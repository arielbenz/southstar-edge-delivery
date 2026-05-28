/**
 * block-parser.integration.test.js
 *
 * Loads the tests/fixtures/mock-blocks.html fixture with JSDOM and verifies
 * that parseBlock() correctly reads each real block in the project.
 *
 * Note: we use JSON.parse(readFileSync(...)) to import schemas
 * instead of import assertions, for compatibility with Node 18/Vite 5.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';
import { parseBlock } from '../../scripts/utils/block-parser.js';

// ─── Setup: parsear el fixture una sola vez ───────────────────────────────────

const fixturePath = resolve('tests/fixtures/mock-blocks.html');
const html = readFileSync(fixturePath, 'utf-8');
const { document } = new JSDOM(html).window;

// ─── Cargar schemas ───────────────────────────────────────────────────────────

function loadSchema(relPath) {
  const json = JSON.parse(readFileSync(resolve(relPath), 'utf-8'));
  // _block.json files may have the schema under the "eds" key or at the root
  return json.eds ?? json;
}

const accordionSchema = loadSchema('blocks/accordion/_accordion.json');
const plansSchema = loadSchema('blocks/plans/_plans.json');
const promoBannerSchema = loadSchema('blocks/promo-banner/_promo-banner.json');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BlockParser — integration with real fixture', () => {
  // ── accordion ──────────────────────────────────────────────────────────────
  describe('accordion', () => {
    let result;
    beforeAll(() => {
      const el = document.querySelector('.accordion');
      result = parseBlock(el, accordionSchema);
    });

    test('the result is not null or undefined', () => {
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    test('heading is a non-empty string', () => {
      expect(typeof result.heading).toBe('string');
      expect(result.heading.length).toBeGreaterThan(0);
    });

    test('description is html (string with tags)', () => {
      expect(typeof result.description).toBe('string');
      expect(result.description).toContain('<p>');
    });

    test('items is an array with 3 elements', () => {
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items).toHaveLength(3);
    });

    test('each item has title (string) and content (html)', () => {
      for (const item of result.items) {
        expect(typeof item.title).toBe('string');
        expect(item.title.length).toBeGreaterThan(0);
        expect(typeof item.content).toBe('string');
        expect(item.content).toContain('<p>');
      }
    });
  });

  // ── plans ──────────────────────────────────────────────────────────────────
  describe('plans', () => {
    let result;
    beforeAll(() => {
      const el = document.querySelector('.plans');
      result = parseBlock(el, plansSchema);
    });

    test('result is not null or undefined', () => {
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    test('items is an array with 3 plans', () => {
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items).toHaveLength(3);
    });

    test('rate and term are strings', () => {
      for (const plan of result.items) {
        expect(typeof plan.rate).toBe('string');
        expect(typeof plan.term).toBe('string');
      }
    });

    test('featured is boolean', () => {
      for (const plan of result.items) {
        expect(typeof plan.featured).toBe('boolean');
      }
    });

    test('exactly 1 plan has featured=true', () => {
      const featured = result.items.filter((p) => p.featured === true);
      expect(featured).toHaveLength(1);
      expect(featured[0].planName).toBe('Fixed Rate 24 Month');
    });

    test('featuresHtml is html with <ul>', () => {
      for (const plan of result.items) {
        expect(plan.featuresHtml).toContain('<ul>');
      }
    });
  });

  // ── promo-banner ───────────────────────────────────────────────────────────
  describe('promo-banner', () => {
    let result;
    beforeAll(() => {
      const el = document.querySelector('.promo-banner');
      result = parseBlock(el, promoBannerSchema);
    });

    test('result is not null or undefined', () => {
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    test('title is a non-empty string', () => {
      expect(typeof result.title).toBe('string');
      expect(result.title.length).toBeGreaterThan(0);
    });

    test('body is html with <p>', () => {
      expect(typeof result.body).toBe('string');
      expect(result.body).toContain('<p>');
    });

    test('ctaUrl contains /enroll', () => {
      expect(typeof result.ctaUrl).toBe('string');
      expect(result.ctaUrl).toContain('/enroll');
    });

    test('variant is a non-empty string', () => {
      expect(typeof result.variant).toBe('string');
      expect(result.variant).toBe('seasonal');
    });
  });
});
