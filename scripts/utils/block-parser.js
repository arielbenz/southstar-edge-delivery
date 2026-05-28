/**
 * block-parser.js
 *
 * Parses an EDS block DOM element according to a _block.json schema.
 *
 * Supported structures:
 *   - simple:    each field points to a specific row/column by index
 *   - key-value: row pairs where col0 is the key and col1 is the value
 *   - container: N header rows + item rows
 *
 * Field types:
 *   text, html, number, boolean, list, link, image
 */

// ─── Value extractors ────────────────────────────────────────────────────────

/**
 * Extracts the typed value from a cell element.
 * @param {Element} el — DOM cell element
 * @param {string} type — field type according to the schema
 * @returns {*}
 */
export function extractValue(el, type) {
  if (!el) return null;

  switch (type) {
    case 'text':
      return el.textContent?.trim() ?? null;

    case 'html':
      return el.innerHTML?.trim() ?? null;

    case 'number': {
      const raw = el.textContent?.trim() ?? '';
      const num = parseFloat(raw);
      return Number.isNaN(num) ? null : num;
    }

    case 'boolean':
      return el.textContent?.trim().toLowerCase() === 'true';

    case 'list': {
      const listItems = [...el.querySelectorAll('li')];
      if (listItems.length > 0) {
        return listItems.map((li) => li.textContent.trim());
      }
      // Fallback: comma-separated text
      return el.textContent
        .trim()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    case 'link': {
      const anchor = el.querySelector('a');
      if (anchor) return anchor.getAttribute('href') ?? anchor.href ?? null;
      return el.textContent?.trim() ?? null;
    }

    case 'image': {
      const img = el.querySelector('img');
      if (img) {
        return {
          src: img.getAttribute('src') ?? img.src ?? null,
          alt: img.getAttribute('alt') ?? '',
        };
      }
      return null;
    }

    case 'picture': {
      const pic = el.querySelector('picture');
      if (pic) return pic;
      const img = el.querySelector('img');
      return img ?? null;
    }

    default:
      return el.textContent?.trim() ?? null;
  }
}

// ─── Structure parsers ────────────────────────────────────────────────────────

/**
 * Parses a block with `simple` structure.
 * Each field references a row and column by index (row, col).
 */
function parseSimple(rows, schema) {
  const result = {};
  for (const field of schema.fields ?? []) {
    const row = rows[field.row ?? 0] ?? null;
    const col = row ? ([...row.children][field.col ?? 0] ?? null) : null;
    result[field.name] = extractValue(col, field.type);
  }
  return result;
}

/**
 * Parses a block with `key-value` structure.
 * Each row has col0 = key (text) and col1 = value.
 * The schema maps DOM keys to typed field names.
 */
function parseKeyValue(rows, schema) {
  // Build key → cell element map
  const rawMap = {};
  for (const row of rows) {
    const cols = [...row.children];
    if (cols.length < 2) continue;
    const key = cols[0].textContent.trim().toLowerCase().replace(/\s+/g, '-');
    rawMap[key] = cols[1];
  }

  const result = {};
  for (const field of schema.fields ?? []) {
    // The DOM key can be explicit in `field.key` or derived from the field name
    const domKey =
      field.key ??
      field.name
        .replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)
        .replace(/^-/, '');
    const el = rawMap[domKey] ?? null;
    result[field.name] = extractValue(el, field.type);
  }
  return result;
}

/**
 * Parses a block with `container` structure.
 * The first `headerRows` rows are the header; the rest are items.
 * If `headerRows === 0` there is no header and all rows are items.
 */
function parseContainer(rows, schema) {
  const headerRows = schema.headerRows ?? 1;
  const headRows = rows.slice(0, headerRows);
  const itemRows = rows.slice(headerRows);

  // Supports new format (headerFields / itemFields) and legacy format (header.fields / items.fields)
  const headerFieldDefs = schema.headerFields ?? schema.header?.fields ?? [];
  const itemFieldDefs = schema.itemFields ?? schema.items?.fields ?? [];

  // Parse header
  const header = {};
  if (headerRows > 0 && headerFieldDefs.length) {
    const firstRow = headRows[0];
    if (firstRow) {
      const cols = [...firstRow.children];
      for (const field of headerFieldDefs) {
        const col = cols[field.col ?? 0] ?? null;
        header[field.name] = extractValue(col, field.type);
      }
    }
  }

  // Parse items
  const items = itemRows.map((row) => {
    const cols = [...row.children];
    const item = {};
    for (const field of itemFieldDefs) {
      const col = cols[field.col ?? 0] ?? null;
      item[field.name] = extractValue(col, field.type);
    }
    return item;
  });

  return { ...header, items };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parses an EDS block DOM element according to the given schema.
 *
 * @param {Element} blockEl — root block element (with class="block-name")
 * @param {Object} schema   — contents of the corresponding _block.json
 * @returns {Object} structured block data
 * @throws {Error} if `schema.structure` is unknown
 */
export function parseBlock(blockEl, schema) {
  if (!blockEl || !schema) {
    throw new Error('parseBlock: blockEl and schema are required');
  }

  // Use children instead of querySelectorAll(':scope > div') to ensure
  // compatibility with elements detached from the document (tests)
  const rows = [...blockEl.children].filter((el) => el.tagName === 'DIV');

  switch (schema.structure) {
    case 'simple':
      return parseSimple(rows, schema);
    case 'key-value':
      return parseKeyValue(rows, schema);
    case 'container':
      return parseContainer(rows, schema);
    default:
      throw new Error(`parseBlock: unknown structure "${schema.structure}"`);
  }
}

/**
 * Reads a block using either a raw schema or a full _block.json object.
 *
 * @param {Element} blockEl
 * @param {Object} schemaOrBlockJson
 * @returns {Object}
 */
export function readBlock(blockEl, schemaOrBlockJson) {
  const schema = schemaOrBlockJson?.eds ?? schemaOrBlockJson;
  return parseBlock(blockEl, schema);
}
