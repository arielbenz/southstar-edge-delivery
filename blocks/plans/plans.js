/**
 * plans.js — EDS entry point for the Plans block
 *
 * Parses the pre-rendered HTML from the document and mounts the React component.
 */
import { parseBlock } from '../../scripts/utils/block-parser.js';
import { loadReact } from '../../scripts/utils/react-loader.js';

const SCHEMA = {
  structure: 'container',
  headerRows: 0,
  itemFields: [
    { name: 'planName', col: 0, type: 'text' },
    { name: 'rate', col: 1, type: 'text' },
    { name: 'term', col: 2, type: 'text' },
    { name: 'featuresHtml', col: 3, type: 'html' },
    { name: 'featured', col: 4, type: 'boolean' },
  ],
};

export default async function decorate(block) {
  const { items } = parseBlock(block, SCHEMA);
  const plans = items.map((item, idx) => ({ id: `plan-${idx}`, ...item }));

  block.innerHTML = '';
  const mountPoint = document.createElement('div');
  mountPoint.classList.add('plans-mount');
  block.append(mountPoint);

  const [{ React, ReactDOM }, { default: Plans }] = await Promise.all([
    loadReact(),
    import('./components/Plans.bundle.js'),
  ]);

  const root = ReactDOM.createRoot(mountPoint);
  root.render(React.createElement(Plans, { plans }));
}
