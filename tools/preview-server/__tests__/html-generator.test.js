import { describe, it, expect } from 'vitest';
import {
  generateBlockHTML,
  getMockForVariant,
  getVariants,
} from '../html-generator.js';

// ── generateBlockHTML ────────────────────────────────────────────────────────

describe('generateBlockHTML', () => {
  // 1. Simple block
  it('simple block — renders each field as a row with one cell', () => {
    const schema = {
      structure: 'simple',
      fields: [{ name: 'title', col: 0, type: 'text' }],
    };
    const mock = { title: 'Hello World' };
    const html = generateBlockHTML('hero', schema, mock);

    expect(html).toContain('Hello World');
    // EDS double cell wrapper
    expect(html).toContain('<div><div>Hello World</div></div>');
  });

  // 2. Key-value block
  it('key-value block — renders key|value rows', () => {
    const schema = {
      structure: 'key-value',
      fields: [
        { name: 'rate', type: 'number' },
        { name: 'cta', type: 'link' },
      ],
    };
    const mock = { rate: '12.4', cta: '/enroll' };
    const html = generateBlockHTML('calculator', schema, mock);

    // Row "rate" with value
    expect(html).toContain('<div><div>rate</div></div>');
    expect(html).toContain('<div><div>12.4</div></div>');
    // Row "cta" with link
    expect(html).toContain('<div><div>cta</div></div>');
    expect(html).toContain('<a href="/enroll">/enroll</a>');
  });

  // 3. Container block with header and items
  it('container block — renders header row + item rows', () => {
    const schema = {
      structure: 'container',
      headerRows: 1,
      headerFields: [{ name: 'heading', col: 0, type: 'text' }],
      itemFields: [
        { name: 'title', col: 0, type: 'text' },
        { name: 'content', col: 1, type: 'html' },
      ],
    };
    const mock = {
      heading: 'FAQ',
      items: [{ title: 'Q1', content: '<p>A1</p>' }],
    };
    const html = generateBlockHTML('accordion', schema, mock);

    // Header
    expect(html).toContain('FAQ');
    // Item
    expect(html).toContain('Q1');
    expect(html).toContain('<p>A1</p>');

    // 2 rows: 1 header + 1 item (each row is a top-level <div> within the block)
    const rowMatches = html.match(/<div>\n    <div><div>/g);
    expect(rowMatches).toHaveLength(2);
  });

  // 4. Classes from mock
  it('add classes from mock to block element', () => {
    const schema = {
      structure: 'simple',
      fields: [{ name: 'title', type: 'text' }],
    };
    const mock = { title: 'Alert', classes: ['urgent'] };
    const html = generateBlockHTML('promo-banner', schema, mock);

    expect(html).toContain('class="promo-banner urgent"');
  });

  // 5. Type picture — generates <picture><img>
  it('type picture — generates <picture><img>', () => {
    const schema = {
      structure: 'simple',
      fields: [{ name: 'image', type: 'picture' }],
    };
    const mock = { image: '/img/hero.svg' };
    const html = generateBlockHTML('hero', schema, mock);

    expect(html).toContain('<picture><img src="/img/hero.svg"');
  });

  // 6. Type link — generates <a href>
  it('type link — generates <a href>', () => {
    const schema = {
      structure: 'simple',
      fields: [{ name: 'cta', type: 'link' }],
    };
    const mock = { cta: '/plans' };
    const html = generateBlockHTML('hero', schema, mock);

    expect(html).toContain('<a href="/plans">');
  });

  // 7. Schema or mock null returns preview-error
  it('schema null — returns preview-error', () => {
    const html = generateBlockHTML('test', null, {});
    expect(html).toContain('preview-error');
  });

  it('mock null — returns preview-error', () => {
    const html = generateBlockHTML(
      'test',
      { structure: 'simple', fields: [] },
      null,
    );
    expect(html).toContain('preview-error');
  });
});

// ── getMockForVariant ────────────────────────────────────────────────────────

describe('getMockForVariant', () => {
  const mockArray = [
    { _variant: 'urgent', title: 'Urgent' },
    { _variant: 'default', title: 'Default' },
  ];

  // 8. Array with variants — selects by _variant
  it('array — selects the correct variant', () => {
    expect(getMockForVariant(mockArray, 'urgent')).toEqual({
      _variant: 'urgent',
      title: 'Urgent',
    });
  });

  it('array — nonexistent variant returns first element', () => {
    expect(getMockForVariant(mockArray, 'nonexistent')).toEqual({
      _variant: 'urgent',
      title: 'Urgent',
    });
  });

  // 9. Simple object
  it('simple object — returns it directly regardless of variant', () => {
    const mockObj = { title: 'Hello' };
    expect(getMockForVariant(mockObj, 'anything')).toEqual({ title: 'Hello' });
  });

  it('mock null — returns null', () => {
    expect(getMockForVariant(null, 'default')).toBeNull();
  });
});

// ── getVariants ──────────────────────────────────────────────────────────────

describe('getVariants', () => {
  // 10. Array of mocks
  it('array — extracts id and label from each element', () => {
    const mock = [
      { _variant: 'a', _label: 'A' },
      { _variant: 'b', _label: 'B' },
    ];
    expect(getVariants(mock)).toEqual([
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ]);
  });

  // 11. Simple object
  it('simple object — returns default variant', () => {
    const mock = { title: 'Hello' };
    expect(getVariants(mock)).toEqual([{ id: 'default', label: 'Default' }]);
  });

  it('mock null — returns empty array', () => {
    expect(getVariants(null)).toEqual([]);
  });

  it('_variant without _label uses _variant as label', () => {
    const mock = [{ _variant: 'seasonal' }];
    expect(getVariants(mock)).toEqual([{ id: 'seasonal', label: 'seasonal' }]);
  });
});
