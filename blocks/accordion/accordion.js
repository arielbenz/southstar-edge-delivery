/**
 * Accordion block
 *
 * EDS table structure:
 *   Row 0: heading (col0) | description (col1)
 *   Row 1..N: item title (col0) | item content (col1)
 *
 * BEM prefix: cmp-accordion (CSS compatibility with legacy project)
 */
import { parseBlock } from '../../scripts/utils/block-parser.js';

const CHEVRON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  <polyline points="6 9 12 15 18 9"></polyline>
</svg>`;

const SCHEMA = {
  structure: 'container',
  headerRows: 1,
  headerFields: [
    { name: 'heading', col: 0, type: 'text' },
    { name: 'description', col: 1, type: 'html' },
  ],
  itemFields: [
    { name: 'title', col: 0, type: 'html' },
    { name: 'content', col: 1, type: 'html' },
  ],
};

let idCounter = 0;
function uid(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function updateToggleButtons(inner) {
  const items = [...inner.querySelectorAll('.cmp-accordion__item')];
  const showBtn = inner.querySelector('.cmp-accordion__action--show');
  const hideBtn = inner.querySelector('.cmp-accordion__action--hide');
  if (!showBtn || !hideBtn) return;

  const allOpen = items.every((item) => item.querySelector('details').open);
  const allClosed = items.every((item) => !item.querySelector('details').open);

  showBtn.disabled = allOpen;
  showBtn.setAttribute(
    'aria-label',
    allOpen ? 'All items are expanded' : 'Show all items',
  );
  hideBtn.disabled = allClosed;
  hideBtn.setAttribute(
    'aria-label',
    allClosed ? 'All items are collapsed' : 'Hide all items',
  );
}

export default function decorate(block) {
  const { heading, description, items } = parseBlock(block, SCHEMA);
  const blockId = uid('accordion');

  const itemsHTML = items
    .map((item) => {
      const itemId = uid(`${blockId}-item`);
      const summaryId = `${itemId}-summary`;
      const panelId = `${itemId}-panel`;
      return `
      <div class="cmp-accordion__item" role="listitem">
        <details id="${itemId}" aria-labelledby="${summaryId}">
          <summary id="${summaryId}" class="cmp-accordion__summary" role="button"
            aria-expanded="false" aria-controls="${panelId}">
            <span class="cmp-accordion__title">${item.title ?? ''}</span>
            <span class="cmp-accordion__chevron">${CHEVRON_SVG}</span>
          </summary>
          <div id="${panelId}" class="cmp-accordion__panel" role="region"
            aria-labelledby="${summaryId}">${item.content ?? ''}</div>
        </details>
      </div>`;
    })
    .join('');

  block.innerHTML = `
    <div class="cmp-accordion__inner">
      <div class="cmp-accordion__head">
        ${heading ? `<div class="cmp-accordion__overview-header"><h2 class="cmp-accordion__heading">${heading}</h2></div>` : ''}
        <div class="cmp-accordion__actions" role="group" aria-label="Accordion controls">
          <button type="button" class="cmp-accordion__action cmp-accordion__action--show" aria-label="Show all items">Show All</button>
          <button type="button" class="cmp-accordion__action cmp-accordion__action--hide" aria-label="Hide all items">Hide All</button>
        </div>
        ${description ? `<div class="cmp-accordion__description">${description}</div>` : ''}
      </div>
      <div class="cmp-accordion__content" role="list">${itemsHTML}</div>
    </div>`;

  const inner = block.querySelector('.cmp-accordion__inner');

  // toggle does not bubble → listener per details
  inner.querySelectorAll('details').forEach((details) => {
    details.addEventListener('toggle', () => {
      details
        .querySelector('summary')
        .setAttribute('aria-expanded', details.open ? 'true' : 'false');
      updateToggleButtons(inner);
    });
  });

  inner
    .querySelector('.cmp-accordion__action--show')
    .addEventListener('click', () => {
      inner.querySelectorAll('details').forEach((d) => {
        d.open = true;
      });
      updateToggleButtons(inner);
    });

  inner
    .querySelector('.cmp-accordion__action--hide')
    .addEventListener('click', () => {
      inner.querySelectorAll('details').forEach((d) => {
        d.open = false;
      });
      updateToggleButtons(inner);
    });

  updateToggleButtons(inner);
}
