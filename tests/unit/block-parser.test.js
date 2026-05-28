/**
 * block-parser.test.js — 13 unit tests for block-parser.js
 * Uses jsdom via the vitest environment (environment: 'jsdom')
 */
import { parseBlock, extractValue } from '../../scripts/utils/block-parser.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Creates a DOM element from an HTML string */
function html(raw) {
  const div = document.createElement('div');
  div.innerHTML = raw;
  return div.firstElementChild;
}

/** Builds an EDS block with rows and cells */
function makeBlock(rows) {
  const block = document.createElement('div');
  for (const cells of rows) {
    const row = document.createElement('div');
    for (const cellHtml of cells) {
      const cell = document.createElement('div');
      cell.innerHTML = cellHtml;
      row.appendChild(cell);
    }
    block.appendChild(row);
  }
  return block;
}

// ─── Tests: extractValue ──────────────────────────────────────────────────────

describe('extractValue', () => {
  test('type text — returns trimmed textContent', () => {
    const el = html('<div>  Hello World  </div>');
    expect(extractValue(el, 'text')).toBe('Hello World');
  });

  test('type html — returns trimmed innerHTML', () => {
    const el = html('<div><p>Bold <strong>text</strong></p></div>');
    expect(extractValue(el, 'html')).toBe('<p>Bold <strong>text</strong></p>');
  });

  test('type number — parses float from textContent', () => {
    const el = html('<div>52.9</div>');
    expect(extractValue(el, 'number')).toBe(52.9);
  });

  test('type number — returns null if not a number', () => {
    const el = html('<div>not-a-number</div>');
    expect(extractValue(el, 'number')).toBeNull();
  });

  test('type boolean — "true" → true', () => {
    const el = html('<div>true</div>');
    expect(extractValue(el, 'boolean')).toBe(true);
  });

  test('type boolean — "false" → false', () => {
    const el = html('<div>false</div>');
    expect(extractValue(el, 'boolean')).toBe(false);
  });

  test('type list — extracts items from <ul>', () => {
    const el = html(
      '<div><ul><li>Franklin</li><li>Delaware</li><li>Licking</li></ul></div>',
    );
    expect(extractValue(el, 'list')).toEqual([
      'Franklin',
      'Delaware',
      'Licking',
    ]);
  });

  test('type list — fallback to comma-separated text', () => {
    const el = html('<div>Franklin, Delaware, Licking</div>');
    expect(extractValue(el, 'list')).toEqual([
      'Franklin',
      'Delaware',
      'Licking',
    ]);
  });

  test('type link — returns href from <a>', () => {
    const el = html(
      '<div><a href="/enroll?utility=columbia-gas">Enroll</a></div>',
    );
    expect(extractValue(el, 'link')).toBe('/enroll?utility=columbia-gas');
  });

  test('type image — returns { src, alt } from <img>', () => {
    const el = html(
      '<div><img src="/media/logo.png" alt="Company Logo"></div>',
    );
    expect(extractValue(el, 'image')).toEqual({
      src: '/media/logo.png',
      alt: 'Company Logo',
    });
  });
});

// ─── Tests: parseBlock ────────────────────────────────────────────────────────

describe('parseBlock', () => {
  test('simple structure — maps fields by row/col', () => {
    const block = makeBlock([['Ohio Natural Gas', '<p>Tagline</p>']]);
    const schema = {
      structure: 'simple',
      fields: [
        { name: 'title', type: 'text', row: 0, col: 0 },
        { name: 'tagline', type: 'html', row: 0, col: 1 },
      ],
    };
    const result = parseBlock(block, schema);
    expect(result.title).toBe('Ohio Natural Gas');
    expect(result.tagline).toBe('<p>Tagline</p>');
  });

  test('key-value structure — maps keys to typed fields', () => {
    const block = makeBlock([
      ['title', 'Limited Time Offer'],
      ['cta-url', '<a href="/enroll">Enroll</a>'],
      ['variant', 'seasonal'],
    ]);
    const schema = {
      structure: 'key-value',
      fields: [
        { name: 'title', key: 'title', type: 'text' },
        { name: 'ctaUrl', key: 'cta-url', type: 'link' },
        { name: 'variant', key: 'variant', type: 'text' },
      ],
    };
    const result = parseBlock(block, schema);
    expect(result.title).toBe('Limited Time Offer');
    expect(result.ctaUrl).toBe('/enroll');
    expect(result.variant).toBe('seasonal');
  });

  test('container structure — separates header from items', () => {
    const block = makeBlock([
      ['FAQ Section', '<p>Common questions</p>'], // header
      ['Question 1', '<p>Answer 1</p>'], // item
      ['Question 2', '<p>Answer 2</p>'], // item
    ]);
    const schema = {
      structure: 'container',
      headerRows: 1,
      header: {
        fields: [
          { name: 'heading', type: 'text', col: 0 },
          { name: 'description', type: 'html', col: 1 },
        ],
      },
      items: {
        fields: [
          { name: 'title', type: 'text', col: 0 },
          { name: 'content', type: 'html', col: 1 },
        ],
      },
    };
    const result = parseBlock(block, schema);
    expect(result.heading).toBe('FAQ Section');
    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe('Question 1');
  });

  test('unknown structure — throws a descriptive error', () => {
    const block = makeBlock([['data']]);
    expect(() => parseBlock(block, { structure: 'unknown' })).toThrow(
      'unknown structure "unknown"',
    );
  });
});
