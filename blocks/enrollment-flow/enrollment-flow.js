import { readBlock } from '../../scripts/utils/block-parser.js';
import { loadReact } from '../../scripts/utils/react-loader.js';
import schema from './_enrollment-flow.json' assert { type: 'json' };

export default async function decorate(block) {
  const { configPath } = readBlock(block, schema);
  const isDev = window.__PREVIEW_SERVER === true;

  block.innerHTML = '';
  const mountPoint = document.createElement('div');
  mountPoint.id = 'enrollment-root';
  block.append(mountPoint);

  try {
    const [{ React, ReactDOM }, { default: EnrollmentFlow }] =
      await Promise.all([
        loadReact(),
        isDev
          ? import('./components/EnrollmentFlow.jsx')
          : import('./components/EnrollmentFlow.bundle.js'),
      ]);

    const root = ReactDOM.createRoot(mountPoint);
    root.render(React.createElement(EnrollmentFlow, { configPath }));
  } catch (error) {
    const errorEl = document.createElement('div');
    errorEl.className = 'enrollment-flow enrollment-flow--error';
    errorEl.setAttribute('role', 'alert');
    errorEl.textContent = error.message;
    mountPoint.append(errorEl);
  }
}
