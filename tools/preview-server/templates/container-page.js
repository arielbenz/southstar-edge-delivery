/**
 * templates/container-page.js
 *
 * renderContainerPage(blockName, blockHTML) → HTML string
 *
 * Minimal EDS-style container page for the Sidekick Library block renderer.
 * The renderer fetches this URL, replaces <main> with the selected block HTML,
 * then renders the result in an iframe.
 *
 * Also works when visited directly: shows the block's default variant with all
 * EDS styles and scripts applied.
 */

export function renderContainerPage(blockName, blockHTML) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blockName}</title>
  <link rel="stylesheet" href="/styles/tokens.css">
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/styles/lazy-styles.css">
  <link rel="stylesheet" href="/blocks/${blockName}/${blockName}.css">
  <!-- Required by @vitejs/plugin-react in dev mode -->
  <script type="module">
    import RefreshRuntime from '/@react-refresh'
    RefreshRuntime.injectIntoGlobalHook(window)
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => () => {}
    window.__vite_plugin_react_preamble_installed__ = true
  </script>
</head>
<body>
  <header></header>
  <main>
    <div>
      ${blockHTML}
    </div>
  </main>
  <footer></footer>

  <script>window.__PREVIEW_SERVER = true</script>
  <script type="module">
    const url = new URL(window.location)
    if (!url.searchParams.has('mock')) {
      url.searchParams.set('mock', 'true')
      window.history.replaceState({}, '', url)
    }

    const blockEl = document.querySelector('[data-block-name="${blockName}"]')
    if (blockEl) {
      try {
        const mod = await import('/blocks/${blockName}/${blockName}.js')
        if (typeof mod.default === 'function') {
          await mod.default(blockEl)
        }
      } catch (err) {
        console.error('[Sidekick] Error in decorate():', err)
        blockEl.insertAdjacentHTML('beforebegin',
          '<div style="background:#FFEBEE;border-left:4px solid #C62828;padding:1rem;font-family:monospace;font-size:0.75rem">' +
          '<strong>Error en decorate()</strong><pre>' + err.message + '</pre></div>'
        )
      }
    }
  </script>
</body>
</html>`;
}
