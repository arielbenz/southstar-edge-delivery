/**
 * react-loader.js
 *
 * Loads React and ReactDOM from the correct source depending on the environment:
 *   - Preview server (Vite dev): local node_modules — same instance used by .jsx files
 *   - Production (EDS, no bundler): esm.sh CDN
 *
 * Usage:
 *   import { loadReact } from '../../scripts/utils/react-loader.js';
 *
 *   const { React, ReactDOM } = await loadReact();
 *   const root = ReactDOM.createRoot(mountPoint);
 *   root.render(React.createElement(MyComponent, props));
 */

/**
 * Returns { React, ReactDOM } loaded from the appropriate source.
 * @returns {Promise<{ React: object, ReactDOM: object }>}
 */
export async function loadReact() {
  if (window.__PREVIEW_SERVER) {
    const [{ default: React }, { default: ReactDOM }] = await Promise.all([
      import('react'),
      import('react-dom/client'),
    ]);
    return { React, ReactDOM };
  }

  const [{ default: React }, { default: ReactDOM }] = await Promise.all([
    import('https://esm.sh/react@18'),
    import('https://esm.sh/react-dom@18/client'),
  ]);
  return { React, ReactDOM };
}
