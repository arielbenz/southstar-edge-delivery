/**
 * templates/preview-page.js
 *
 * renderPreviewPage(block, variant, mockData) → HTML string
 *
 * Full-page HTML wrapper that loads the block's decorate() via Vite
 * and renders a single variant with a viewport switcher toolbar.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateBlockHTML, getVariants } from '../html-generator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(__dirname, 'styles', 'preview.css'), 'utf-8');

export function renderPreviewPage(
  block,
  variant,
  mockData,
  brand = 'southstar',
) {
  const { name, json } = block;
  const variants = getVariants(json.mock);
  const structure = json.eds?.structure ?? '?';

  const metaTags = mockData?._meta
    ? Object.entries(mockData._meta)
        .map(([k, v]) => `<meta name="${k}" content="${v}">`)
        .join('\n  ')
    : '';

  const extraParams = mockData?._queryParams
    ? Object.entries(mockData._queryParams)
        .map(([k, v]) => `url.searchParams.set('${k}', '${v}')`)
        .join('\n    ')
    : '';

  const blockHTML = generateBlockHTML(name, json.eds, mockData);

  const variantSelect =
    variants.length > 1
      ? `<select id="variant-select" onchange="changeVariant(this.value)">
        ${variants.map((v) => `<option value="${v.id}"${v.id === variant ? ' selected' : ''}>${v.label}</option>`).join('\n        ')}
      </select>`
      : '';

  const blockBody =
    name === 'header'
      ? `<header><div class="nav-wrapper">${blockHTML}</div></header>`
      : name === 'footer'
        ? `<footer>${blockHTML}</footer>`
        : `<div>${blockHTML}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}${variant !== 'default' ? ` · ${variant}` : ''} — Block Preview</title>
  ${metaTags}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap">
  <link rel="stylesheet" href="/styles/tokens.css">
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/styles/lazy-styles.css">
  <link rel="stylesheet" href="/blocks/${name}/${name}.css">
  <link rel="stylesheet" href="/styles/brands/${brand}/tokens.css" data-brand-tokens>
  <!-- React refresh preamble — required by @vitejs/plugin-react in dev mode -->
  <script type="module">
    import RefreshRuntime from '/@react-refresh'
    RefreshRuntime.injectIntoGlobalHook(window)
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => () => {}
    window.__vite_plugin_react_preamble_installed__ = true
  </script>
  <style>${CSS}</style>
</head>
<body>

  <style>
    body { padding-top: 64px; }
    .pbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      display: flex; align-items: center; gap: 16px; height: 100px;
      padding: 0 24px;
      background: var(--surface); border-bottom: 1px solid var(--border);
      font-family: 'DM Sans', system-ui, sans-serif; font-size: 13px;
    }
    .pbar-logo {
      display: flex; align-items: center; gap: 10px;
      font-weight: 700; font-size: 17px; color: var(--text);
      text-decoration: none; white-space: nowrap; flex-shrink: 0;
    }
    .logo-dot {
      width: 12px; height: 12px; border-radius: 50%;
      background: var(--accent); box-shadow: 0 0 8px rgba(232, 119, 34, 0.6);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
    .pbar-back {
      background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
      color: var(--muted); font-size: 13px; padding: 6px 12px;
      text-decoration: none; transition: color .15s, border-color .15s;
      white-space: nowrap; flex-shrink: 0;
    }
    .pbar-back:hover { color: var(--text); border-color: var(--border-h); }
    .pbar-sep { width: 1px; height: 20px; background: var(--border-h); flex-shrink: 0; margin: 0 4px; }
    .pbar-name {
      font-family: 'DM Mono', monospace; font-size: 13px;
      color: var(--text); font-weight: 500;
    }
    .pbar-badge {
      background: var(--panel); border: 1px solid var(--border); border-radius: 6px;
      color: var(--muted); font-size: 11px; padding: 3px 9px;
      text-transform: uppercase; letter-spacing: .04em; font-family: 'DM Mono', monospace;
    }
    .pbar-variant {
      background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
      color: var(--text); font-family: 'DM Sans', system-ui, sans-serif; font-size: 13px;
      padding: 6px 10px; cursor: pointer; outline: none;
      transition: border-color .15s;
    }
    .pbar-variant:focus { border-color: var(--border-h); }
    .pbar-spacer { flex: 1; }
    .pbar-brand {
      background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
      color: var(--muted); font-family: 'DM Sans', system-ui, sans-serif; font-size: 13px;
      padding: 6px 10px; cursor: pointer; outline: none;
      transition: border-color .15s;
    }
    .pbar-brand:focus { border-color: var(--border-h); }
    .pbar-vp {
      display: flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
    }
    .pbar-vp button {
      background: transparent; border: none; border-right: 1px solid var(--border);
      color: var(--muted); cursor: pointer; font-size: 13px; padding: 6px 14px;
      font-family: 'DM Sans', system-ui, sans-serif;
      transition: background .12s, color .12s;
    }
    .pbar-vp button:last-child { border-right: none; }
    .pbar-vp button:hover  { background: var(--panel); color: var(--text); }
    .pbar-vp button.active { background: var(--panel); color: var(--text); font-weight: 600; }
    .preview-wrap {
      max-width: 100%; margin: 36px auto;
      transition: max-width .3s ease;
    }
    .preview-wrap.tablet { max-width: 768px; }
    .preview-wrap.mobile { max-width: 390px; }
  </style>

  <div class="pbar">
    <a class="pbar-logo" href="/">
      <span class="logo-dot"></span>
      Southstar - EDS Studio
    </a>
    <a class="pbar-back" href="/">&#8592; Dashboard</a>
    <div class="pbar-sep"></div>
    <span class="pbar-name">${name}</span>
    <span class="pbar-badge">${structure}</span>
    <span class="pbar-name">Variant: </span>
    ${variantSelect ? variantSelect.replace('<select ', '<select class="pbar-variant" ') : ''}
    <div class="pbar-spacer"></div>
    
    <div class="pbar-vp">
      <button class="active" id="btn-desktop" onclick="setViewport('desktop')">Desktop</button>
      <button id="btn-tablet" onclick="setViewport('tablet')">Tablet</button>
      <button id="btn-mobile" onclick="setViewport('mobile')">Mobile</button>
    </div>
  </div>

  <div class="preview-wrap" id="preview-wrap">
    <div class="section">
      ${blockBody}
    </div>
  </div>

  <script>window.__PREVIEW_SERVER = true</script>
  <script>
    // Restore theme before first paint to avoid flash
    (function() {
      var t = localStorage.getItem('eds-studio-theme');
      if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
    })();
  </script>
  <script type="module">
    const url = new URL(window.location)

    if (!url.searchParams.has('mock')) {
      url.searchParams.set('mock', 'true')
    }

    ${extraParams}

    window.history.replaceState({}, '', url)

    // ── Decorate the block ────────────────────────────────────────────────
    const blockEl = document.querySelector('[data-block-name="${name}"]')
    if (blockEl) {
      try {
        let mod
        try {
          mod = await import('/blocks/${name}/${name}.js')
        } catch {
          mod = await import('/blocks/${name}/${name}.bundle.js')
        }
        if (typeof mod.default === 'function') {
          await mod.default(blockEl)
        }
      } catch (err) {
        console.error('[Preview] Error in decorate():', err)
        blockEl.insertAdjacentHTML('beforebegin', \`
          <div style="background:#FFEBEE;border-left:4px solid #C62828;padding:1rem;font-family:monospace;font-size:0.75rem">
            <strong>Error en decorate()</strong>
            <pre>\${err.message}\\n\\n\${err.stack}</pre>
          </div>
        \`)
      }
    }

    // ── Viewport switcher ─────────────────────────────────────────────────
    window.setViewport = (size) => {
      const wrap = document.getElementById('preview-wrap')
      wrap.className = 'preview-wrap' + (size !== 'desktop' ? ' ' + size : '')
      document.querySelectorAll('.pbar-vp button').forEach((btn) => {
        btn.classList.toggle('active', btn.id === 'btn-' + size)
      })
      sessionStorage.setItem('preview-viewport', size)
    }

    const savedViewport = sessionStorage.getItem('preview-viewport')
    if (savedViewport) setViewport(savedViewport)

    // ── Brand switcher — swaps tokens link in-place, no reload ─────────────
    window.switchBrand = (newBrand) => {
      const link = document.querySelector('link[data-brand-tokens]')
      if (link) {
        link.href = '/styles/brands/' + newBrand + '/tokens.css'
      } else {
        const l = document.createElement('link')
        l.rel = 'stylesheet'
        l.setAttribute('data-brand-tokens', '')
        l.href = '/styles/brands/' + newBrand + '/tokens.css'
        document.head.appendChild(l)
      }
      const u = new URL(window.location)
      u.searchParams.set('brand', newBrand)
      window.history.replaceState({}, '', u)
    }

    // ── Cambio de variante ────────────────────────────────────────────────
    window.changeVariant = (variantId) => {
      const u = new URL(window.location)
      u.searchParams.set('variant', variantId)
      window.location.href = u.toString()
    }
  </script>
</body>
</html>`;
}
