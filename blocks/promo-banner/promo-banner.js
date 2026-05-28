/**
 * Promo Banner block
 *
 * EDS key-value table structure:
 *   title   | <text>
 *   body    | <rich text>
 *   cta-text | <text>
 *   cta-url  | <link>
 *   variant | urgent | seasonal | default
 */
import { parseBlock } from '../../scripts/utils/block-parser.js';

const SCHEMA = {
  structure: 'key-value',
  fields: [
    { name: 'title', key: 'title', type: 'text' },
    { name: 'body', key: 'body', type: 'html' },
    { name: 'ctaText', key: 'cta-text', type: 'text' },
    { name: 'ctaUrl', key: 'cta-url', type: 'link' },
    { name: 'variant', key: 'variant', type: 'text' },
  ],
};

export default function decorate(block) {
  const {
    title,
    body,
    ctaText,
    ctaUrl,
    variant: rawVariant,
  } = parseBlock(block, SCHEMA);
  const variant = rawVariant ?? 'default';
  block.classList.add(`promo-banner--${variant}`);

  // Construye el nuevo HTML
  const inner = document.createElement('div');
  inner.classList.add('promo-banner__inner');

  if (title) {
    const titleEl = document.createElement('p');
    titleEl.classList.add('promo-banner__title');
    titleEl.textContent = title;
    inner.append(titleEl);
  }

  if (body) {
    const bodyEl = document.createElement('div');
    bodyEl.classList.add('promo-banner__body');
    bodyEl.innerHTML = body;
    inner.append(bodyEl);
  }

  if (ctaUrl && ctaText) {
    const cta = document.createElement('a');
    cta.href = ctaUrl;
    cta.classList.add('button', 'button--primary', 'promo-banner__cta');
    cta.textContent = ctaText;
    inner.append(cta);
  }

  block.innerHTML = '';
  block.append(inner);
}
