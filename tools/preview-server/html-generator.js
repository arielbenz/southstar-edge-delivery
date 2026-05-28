/**
 * html-generator.js
 *
 * Converts the "eds" schema + "mock" section of a _block.json
 * into the exact HTML that EDS would generate in production for that block.
 *
 * EDS golden rule:
 *   Each cell  → <div><div>content</div></div>  (double wrapper)
 *   Each row   → <div> cells... </div>
 *   Block      → <div class="name"> rows... </div>
 */

/**
 * Wraps content in the EDS double cell wrapper.
 */
function wrapCell(content) {
  return `<div><div>${content ?? ''}</div></div>`;
}

/**
 * Wraps an array of cells into an EDS row.
 */
function wrapRow(cells) {
  return `<div>\n    ${cells.join('\n    ')}\n  </div>`;
}

/**
 * Renders a field value according to its EDS type.
 * Produces the HTML that EDS would generate for that content type.
 */
function renderValue(value, type) {
  if (value === null || value === undefined || value === '') return '';

  switch (type) {
    case 'picture':
    case 'image':
      // EDS converts images to <picture><img>
      if (typeof value === 'string') {
        return `<picture><img src="${value}" alt="preview image" loading="lazy"></picture>`;
      }
      return '';

    case 'link':
      // EDS converts links to <a href>
      if (typeof value === 'string') {
        return `<a href="${value}">${value}</a>`;
      }
      return '';

    case 'linkEl':
      // Link with text different from href
      if (typeof value === 'object' && value.href) {
        return `<a href="${value.href}">${value.text ?? value.href}</a>`;
      }
      return '';

    case 'boolean':
      return String(value);

    case 'number':
      return String(value);

    case 'list':
      // EDS leaves lists as comma-separated text
      if (Array.isArray(value)) return value.join(', ');
      return String(value);

    case 'html':
      // Rich text — already comes as HTML
      return value;

    case 'text':
    default:
      return String(value);
  }
}

/**
 * Generates the HTML for an individual EDS field.
 */
function renderField(fieldDef, mockData) {
  const value = mockData[fieldDef.name];
  return renderValue(value, fieldDef.type);
}

/**
 * Generates the full EDS HTML for a block from its schema and mock data.
 *
 * @param {string} blockName - Block name (e.g. "accordion")
 * @param {Object} schema    - The "eds" section of _block.json
 * @param {Object} mock      - The mock data (one variant)
 * @returns {string}         - HTML ready to insert into the DOM
 */
export function generateBlockHTML(blockName, schema, mock) {
  if (!schema || !mock) {
    return `<div class="${blockName} preview-error">
      <p style="color:red;font-family:monospace;padding:1rem">
        ⚠ Missing <code>eds</code> or <code>mock</code> section
        in blocks/${blockName}/_${blockName}.json
      </p>
    </div>`;
  }

  const rows = [];

  // ── Simple: each field is a row with a single cell ─────────────────────────
  if (schema.structure === 'simple') {
    for (const field of schema.fields ?? []) {
      const rendered = renderField(field, mock);
      rows.push(wrapRow([wrapCell(rendered)]));
    }
  }

  // ── Key-value: name/value pairs ────────────────────────────────────────────
  else if (schema.structure === 'key-value') {
    // Use the order defined in schema.fields if available,
    // otherwise use the mock keys (excluding those starting with _)
    const fields = schema.fields?.length
      ? schema.fields
      : Object.keys(mock)
          .filter((k) => !k.startsWith('_'))
          .map((k) => ({ name: k, type: 'text' }));

    for (const field of fields) {
      const value = mock[field.name];
      if (value === undefined || value === null) continue;
      const rendered = renderValue(value, field.type ?? 'text');
      rows.push(
        wrapRow([wrapCell(field.key ?? field.name), wrapCell(rendered)]),
      );
    }
  }

  // ── Container: header rows + item rows ────────────────────────────────
  else if (schema.structure === 'container') {
    // Header rows
    const headerCount = schema.headerRows ?? 0;
    if (headerCount > 0 && schema.headerFields?.length) {
      const headerCells = schema.headerFields.map((field) =>
        wrapCell(renderField(field, mock)),
      );
      rows.push(wrapRow(headerCells));
    }

    // Item rows
    const items = mock.items ?? [];
    for (const item of items) {
      const itemCells = (schema.itemFields ?? []).map((field) =>
        wrapCell(renderField(field, item)),
      );
      rows.push(wrapRow(itemCells));
    }
  } else {
    return `<div class="${blockName} preview-error">
      <p style="color:red;font-family:monospace;padding:1rem">
        ⚠ Unknown structure: "${schema.structure}"
      </p>
    </div>`;
  }

  // Build block classes (name + CSS variants)
  const variantClasses = Array.isArray(mock.classes) ? mock.classes : [];
  const allClasses = [blockName, ...variantClasses].join(' ');

  return `<div class="${allClasses}" data-block-name="${blockName}">
  ${rows.join('\n  ')}
</div>`;
}

/**
 * Returns the mock data for a specific variant.
 * If mock is an array, filters by _variant.
 * If mock is an object, returns it directly.
 *
 * @param {Object|Array} mock
 * @param {string} variant
 * @returns {Object}
 */
export function getMockForVariant(mock, variant = 'default') {
  if (!mock) return null;
  if (Array.isArray(mock)) {
    return mock.find((m) => m._variant === variant) ?? mock[0];
  }
  return mock;
}

/**
 * Returns the list of available variants for a block.
 *
 * @param {Object|Array} mock
 * @returns {Array<{id: string, label: string}>}
 */
export function getVariants(mock) {
  if (!mock) return [];
  if (Array.isArray(mock)) {
    return mock.map((m) => ({
      id: m._variant ?? 'default',
      label: m._label ?? m._variant ?? 'default',
    }));
  }
  return [{ id: 'default', label: 'Default' }];
}
