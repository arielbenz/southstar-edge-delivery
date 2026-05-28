/**
 * Block Preview Server
 *
 * Local server that:
 * 1. Automatically discovers all blocks in the project
 * 2. Reads their _block.json and generates EDS HTML from the "mock" section
 * 3. Serves interactive preview pages with the real decorate()
 * 4. Hot reload via Vite when a block's JS/CSS changes
 * 5. Auto-refresh the dashboard when a new block is added
 *
 * Usage: npm run preview → http://localhost:5175
 */

import { execFile } from 'child_process';
import express from 'express';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { createServer as createViteServer } from 'vite';
import { watch as chokidarWatch } from 'chokidar';
import {
  generateBlockHTML,
  getMockForVariant,
  getVariants,
} from './html-generator.js';

const ROOT = resolve(process.cwd());
const BLOCKS_DIR = join(ROOT, 'blocks');
const PORT = 5175;

// ── Test runner cache ─────────────────────────────────────────────────────────
// Populated once at startup, refreshable via POST /api/run-tests.
// Shape: { total, passed, failed, byBlock: { [blockName]: { passed, failed } }, runAt }
let testCache = null;

function runTests() {
  return new Promise((resolve) => {
    execFile(
      'node',
      ['node_modules/.bin/vitest', 'run', '--reporter=json'],
      { cwd: ROOT, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout) => {
        try {
          const data = JSON.parse(stdout);
          const byBlock = {};

          for (const suite of data.testResults ?? []) {
            // suite.name is an absolute path like /…/blocks/enrollment-flow/__tests__/X.test.jsx
            const rel = suite.name.replace(ROOT + '/', '');
            const match = rel.match(/^blocks\/([^/]+)\//);
            if (!match) continue;
            const block = match[1];
            if (!byBlock[block]) byBlock[block] = { passed: 0, failed: 0 };
            for (const t of suite.assertionResults ?? []) {
              if (t.status === 'passed') byBlock[block].passed++;
              else byBlock[block].failed++;
            }
          }

          testCache = {
            total: data.numTotalTests ?? 0,
            passed: data.numPassedTests ?? 0,
            failed: data.numFailedTests ?? 0,
            byBlock,
            runAt: Date.now(),
          };
        } catch {
          // vitest failed to run or produced no JSON — keep whatever was cached
        }
        resolve(testCache);
      },
    );
  });
}

// ── Utilities ──────────────────────────────────────────────────────────────

function discoverBlocks() {
  try {
    return readdirSync(BLOCKS_DIR)
      .filter((name) => {
        try {
          return statSync(join(BLOCKS_DIR, name)).isDirectory();
        } catch {
          return false;
        }
      })
      .map((name) => {
        const jsonPath = join(BLOCKS_DIR, name, `_${name}.json`);
        try {
          const raw = readFileSync(jsonPath, 'utf-8');
          const json = JSON.parse(raw);
          return { name, json, jsonPath };
        } catch {
          // Block without _block.json — include it but without schema
          return { name, json: {}, jsonPath: null };
        }
      })
      .filter((b) => b !== null);
  } catch {
    return [];
  }
}

function getBlockStatus(block) {
  const { json } = block;
  if (!json.eds && !json.mock) return 'no-json';
  if (!json.eds) return 'no-schema';
  if (!json.mock) return 'no-mock';
  return 'ready';
}

function hasStories(blockName) {
  return existsSync(join(BLOCKS_DIR, blockName, `${blockName}.stories.jsx`));
}

// ── HTML templates ───────────────────────────────────────────────────────────

function renderDashboard(blocks) {
  const ready = blocks.filter((b) => getBlockStatus(b) === 'ready');
  const notReady = blocks.filter((b) => getBlockStatus(b) !== 'ready');
  const reactBlocks = ready.filter(
    (b) =>
      existsSync(join(BLOCKS_DIR, b.name, `${b.name}.jsx`)) ||
      existsSync(join(BLOCKS_DIR, b.name, 'components')),
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Block Preview — Ohio Natural Gas</title>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/styles/tokens.css">
  <style>
    * { box-sizing: border-box }
    body {
      background: var(--color-surface, #f5f5f5);
      font-family: var(--font-sans, system-ui, sans-serif);
      margin: 0;
    }

    /* ── Header ── */
    .header {
      background: var(--color-secondary, #003087);
      color: white;
      padding: 1.25rem 2rem 0;
    }
    .header-top { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap }
    .header h1 { font-size: 1.375rem; margin: 0; color: white }
    .header-stats {
      display: flex;
      gap: 1.5rem;
      margin: 0.75rem 0 0;
      padding: 0.75rem 0;
      border-top: 1px solid rgba(255,255,255,0.15);
      font-size: 0.8rem;
      opacity: 0.85;
    }
    .stat { display: flex; align-items: center; gap: 0.35rem }
    .stat-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: currentColor; opacity: 0.7;
    }
    .stat--green { color: #86efac }
    .stat--red   { color: #fca5a5 }
    .stat--blue  { color: #93c5fd }
    .stat--gray  { color: rgba(255,255,255,0.6) }
    #test-status { transition: opacity 0.3s }
    #test-status.loading { opacity: 0.5 }

    /* ── Content ── */
    .content { padding: 2rem; max-width: 1200px; margin: 0 auto; }

    /* ── Search bar ── */
    .search-wrap {
      margin-bottom: 1.5rem;
      position: relative;
    }
    .search-wrap svg {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #999;
      pointer-events: none;
    }
    #block-search {
      width: 100%;
      max-width: 360px;
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
      color: var(--color-text, #1a1a1a);
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    #block-search:focus {
      border-color: var(--color-primary, #0057b8);
      box-shadow: 0 0 0 3px rgba(0,87,184,0.12);
    }
    #search-count {
      display: inline-block;
      margin-left: 0.75rem;
      font-size: 0.75rem;
      color: var(--color-text-muted, #888);
    }

    /* ── Section titles ── */
    .section-title {
      color: var(--color-text-muted, #666);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      margin: 0 0 0.75rem;
      text-transform: uppercase;
    }

    /* ── Grid & Cards ── */
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      margin-bottom: 2rem;
    }
    .card {
      background: white;
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: 8px;
      color: inherit;
      display: block;
      padding: 1.25rem 1.25rem 0.875rem;
      text-decoration: none;
      transition: box-shadow 0.15s, transform 0.15s;
    }
    .card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-1px) }
    .card.disabled { opacity: 0.45; pointer-events: none }
    .card h2 { font-size: 0.9375rem; margin: 0 0 0.2rem }
    .card p { color: var(--color-text-muted, #666); font-size: 0.8125rem; margin: 0 0 0.6rem }
    .card[data-hidden] { display: none }

    /* ── Badges ── */
    .badges { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 0.25rem }
    .badge {
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      padding: 2px 8px;
    }
    .b-structure { background: #F3E5F5; color: #6A1B9A }
    .b-ready     { background: #E8F5E9; color: #2E7D32 }
    .b-warn      { background: #FFF8E1; color: #E65100 }
    .b-error     { background: #FFEBEE; color: #C62828 }
    .b-variants  { background: #E3F2FD; color: #1565C0 }
    .b-stories   { background: #FFF3E0; color: #E65100 }
    .b-tests     { background: #E8F5E9; color: #2E7D32 }
    .b-tests-fail{ background: #FFEBEE; color: #C62828 }
    .b-tests-pending { background: #F5F5F5; color: #9E9E9E }

    /* ── Warning box ── */
    .warning-box {
      background: #FFF8E1;
      border-left: 4px solid #E65100;
      border-radius: 4px;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      padding: 0.75rem 1rem;
    }
    .warning-box code { background: rgba(0,0,0,0.06); border-radius: 3px; padding: 1px 4px }
    kbd { background: #f0f0f0; border: 1px solid #ccc; border-radius: 3px; font-size: 11px; padding: 1px 5px }
    code { background: rgba(0,0,0,0.2); border-radius: 3px }

    /* ── No-results ── */
    #no-results { display: none; color: var(--color-text-muted, #888); font-size: 0.875rem; padding: 1rem 0 }
  </style>
</head>
<body>
  <div class="header">
    <div class="content" style="padding-bottom:0">
      <div class="header-top">
        <h1>⚡ Block Preview</h1>
      </div>
      <div class="header-stats">
        <span class="stat stat--blue">
          <span class="stat-dot"></span>
          <strong>${blocks.length}</strong> blocks
        </span>
        <span class="stat stat--green">
          <span class="stat-dot"></span>
          <strong>${ready.length}</strong> ready
        </span>
        <span class="stat stat--blue">
          <span class="stat-dot"></span>
          <strong>${reactBlocks.length}</strong> React
        </span>
        <span id="test-status" class="stat stat--gray loading">
          <span class="stat-dot"></span>
          <span id="test-label">running tests…</span>
        </span>
      </div>
    </div>
  </div>

  <div class="content">

    <!-- ── Search ── -->
    <div class="search-wrap">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zm-.823 3.823a4.5 4.5 0 1 1 .707-.707l3.25 3.25a.5.5 0 0 1-.707.707l-3.25-3.25z" fill="currentColor"/>
      </svg>
      <input id="block-search" type="search" placeholder="Filter blocks…" autocomplete="off" />
      <span id="search-count"></span>
    </div>

    <div id="no-results">No blocks match your filter.</div>

    ${
      notReady.length > 0
        ? `
    <div class="warning-box">
      <strong>⚠ ${notReady.length} block(s) without preview</strong> —
      Add the <code>"mock"</code> section to their <code>_block.json</code>
      to enable them.
    </div>`
        : ''
    }

    ${
      ready.length > 0
        ? `
    <p class="section-title">Ready for preview</p>
    <div class="grid" id="grid-ready">
      ${ready
        .map((block) => {
          const variants = getVariants(block.json.mock);
          const structure = block.json.eds?.structure ?? '—';
          const stories = hasStories(block.name);
          const storybookSlug = `blocks-${block.name.replace(/-/g, '')}--default`;

          return `<a class="card" href="/preview/${block.name}" data-block="${block.name}">
          <h2>${block.name}</h2>
          <p>${structure} block</p>
          <div class="badges">
            <span class="badge b-structure">${structure}</span>
            <span class="badge b-ready">✓ ready</span>
            ${variants.length > 1 ? `<span class="badge b-variants">${variants.length} variants</span>` : ''}
            ${stories ? `<span class="badge b-stories">stories</span>` : ''}
            <span class="badge b-tests-pending" data-tests="${block.name}">tests…</span>
          </div>
        </a>`;
        })
        .join('\n      ')}
    </div>`
        : ''
    }

    ${
      notReady.length > 0
        ? `
    <p class="section-title">Not configured</p>
    <div class="grid" id="grid-not-ready">
      ${notReady
        .map((block) => {
          const status = getBlockStatus(block);
          const statusLabel =
            {
              'no-json': 'no _block.json',
              'no-schema': 'no eds section',
              'no-mock': 'no mock section',
            }[status] ?? 'incomplete';
          return `<div class="card disabled" data-block="${block.name}">
          <h2>${block.name}</h2>
          <p>&nbsp;</p>
          <div class="badges">
            <span class="badge b-warn">${statusLabel}</span>
          </div>
        </div>`;
        })
        .join('\n      ')}
    </div>`
        : ''
    }

    <p style="color:var(--color-text-muted,#999);font-size:0.75rem;margin-top:1rem">
      <kbd>?mock=true</kbd> is applied automatically on React blocks ·
      This page refreshes when new blocks are added.
    </p>

  </div>

  <script>
    // ── Auto-refresh when blocks are added ──────────────────────────────────
    let lastCount = ${blocks.length}
    setInterval(async () => {
      try {
        const res = await fetch('/api/blocks')
        const data = await res.json()
        if (data.length !== lastCount) location.reload()
        lastCount = data.length
      } catch {}
    }, 3000)

    // ── Load test results ───────────────────────────────────────────────────
    async function loadTestResults() {
      try {
        const res = await fetch('/api/test-results')
        if (!res.ok) return
        const data = await res.json()

        // Update header stat
        const label = document.getElementById('test-label')
        const stat = document.getElementById('test-status')
        if (data.failed > 0) {
          label.textContent = data.failed + ' test(s) failed'
          stat.className = 'stat stat--red'
        } else if (data.total > 0) {
          label.textContent = data.passed + ' tests passing'
          stat.className = 'stat stat--green'
        } else {
          label.textContent = 'no tests found'
          stat.className = 'stat stat--gray'
        }
        stat.classList.remove('loading')

        // Update per-block badges
        document.querySelectorAll('[data-tests]').forEach((badge) => {
          const blockName = badge.dataset.tests
          const r = data.byBlock?.[blockName]
          if (!r) {
            badge.remove()
            return
          }
          if (r.failed > 0) {
            badge.textContent = r.failed + ' failed'
            badge.className = 'badge b-tests-fail'
          } else {
            badge.textContent = '✓ ' + r.passed + ' tests'
            badge.className = 'badge b-tests'
          }
        })
      } catch {}
    }
    loadTestResults()

    // ── Search / filter ─────────────────────────────────────────────────────
    const input = document.getElementById('block-search')
    const countEl = document.getElementById('search-count')
    const noResults = document.getElementById('no-results')

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase()
      const cards = document.querySelectorAll('.card[data-block]')
      let visible = 0

      cards.forEach((card) => {
        const name = card.dataset.block ?? ''
        const match = !q || name.includes(q)
        card.toggleAttribute('data-hidden', !match)
        if (match) visible++
      })

      countEl.textContent = q ? visible + ' of ' + cards.length : ''
      noResults.style.display = (q && visible === 0) ? 'block' : 'none'
    })

    // Focus search with Cmd/Ctrl+K
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        input.focus()
        input.select()
      }
    })
  </script>
</body>
</html>`;
}

/**
 * Generates a minimal EDS-style container page for the sidekick-library
 * block renderer. The renderer fetches this URL, replaces <main> with the
 * selected block HTML, then renders the result in an iframe.
 *
 * The page also works when visited directly in the browser: it shows the
 * block's default variant with all EDS styles and scripts applied.
 *
 * Note: the renderer rewrites relative href="/" and src="/" to absolute URLs
 * before setting srcdoc, so relative paths here work fine.
 */
function renderContainerPage(blockName, blockHTML) {
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
    // Force ?mock=true so React blocks use their internal mock data
    const url = new URL(window.location)
    if (!url.searchParams.has('mock')) {
      url.searchParams.set('mock', 'true')
      window.history.replaceState({}, '', url)
    }

    // Decorate the block using the same approach as the preview page
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

function renderPreviewPage(block, variant, mockData) {
  const { name, json } = block;
  const variants = getVariants(json.mock);
  const structure = json.eds?.structure ?? '?';

  // Inject special meta tags if the mock defines them
  const metaTags = mockData?._meta
    ? Object.entries(mockData._meta)
        .map(([k, v]) => `<meta name="${k}" content="${v}">`)
        .join('\n  ')
    : '';

  // Additional query params from the mock
  const extraParams = mockData?._queryParams
    ? Object.entries(mockData._queryParams)
        .map(([k, v]) => `'${k}', '${v}'`)
        .join('; ')
    : null;

  const blockHTML = generateBlockHTML(name, json.eds, mockData);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}${variant !== 'default' ? ` · ${variant}` : ''} — Block Preview</title>
  ${metaTags}
  <link rel="stylesheet" href="/styles/tokens.css">
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/styles/lazy-styles.css">
  <link rel="stylesheet" href="/blocks/${name}/${name}.css">
  <!-- React refresh preamble — required by @vitejs/plugin-react in dev mode -->
  <script type="module">
    import RefreshRuntime from '/@react-refresh'
    RefreshRuntime.injectIntoGlobalHook(window)
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => () => {}
    window.__vite_plugin_react_preamble_installed__ = true
  </script>
  <style>
    * { box-sizing: border-box }
    body { font-family: var(--font-sans, system-ui); margin: 0 }

    .toolbar {
      align-items: center;
      background: #0f172a;
      color: #94a3b8;
      display: flex;
      font-family: monospace;
      font-size: 14px;
      gap: 1rem;
      padding: 0 1rem;
      position: sticky;
      top: 0;
      z-index: 9999;
    }
    .toolbar a {
      color: #64748b;
      text-decoration: none;
    }
    .toolbar a:hover { color: #e2e8f0 }
    .toolbar strong { color: #e2e8f0 }
    .toolbar-sep { color: #334155 }

    .toolbar select {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 4px;
      color: #94a3b8;
      font-family: monospace;
      font-size: 11px;
      padding: 3px 6px;
    }
    .toolbar select:focus { outline: none; border-color: #3b82f6 }

    .toolbar-section {
      max-width: 1280px;
      margin: 0 auto; display: flex; align-items: center; gap: 1rem; justify-content: space-between;
    width: 100%;
    padding: var(--space-4) var(--space-6);
    }

    .viewport-btns { display: flex; gap: 4px; margin-left: auto }
    .viewport-btns button {
      background: transparent;
      border: 1px solid #334155;
      border-radius: 4px;
      color: #64748b;
      cursor: pointer;
      font-size: 14px;
      padding: 6px 12px;
      transition: all 0.1s;
    }
    .viewport-btns button:hover { border-color: #475569; color: #94a3b8 }
    .viewport-btns button.active {
      background: #1e293b;
      border-color: #475569;
      color: #e2e8f0;
    }

    .preview-wrap {
      margin: 0 auto;
      min-height: calc(100vh - 40px);
      padding: 2rem;
      transition: max-width 0.3s ease;
    }
    .preview-wrap.viewport-desktop { max-width: 100% }
    .preview-wrap.viewport-tablet  { max-width: 768px }
    .preview-wrap.viewport-mobile  { max-width: 390px }

    .preview-label {
      color: #999;
      font-family: monospace;
      font-size: 11px;
      margin-bottom: 0.5rem;
          max-width: 1280px;
    margin: 0 auto;
    padding: var(--space-2) var(--space-6);
    }

    .error-card {
      background: #FFEBEE;
      border-left: 4px solid #C62828;
      border-radius: 4px;
      color: #C62828;
      font-family: monospace;
      margin-bottom: 1rem;
      padding: 1rem;
    }
    .error-card pre {
      font-size: 0.75rem;
      margin: 0.5rem 0 0;
      overflow-x: auto;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>

  <div class="toolbar">
    <div class="toolbar-section">
      <a href="/">← Dashboard</a>
      <span class="toolbar-sep">|</span>
      <strong>${name}</strong>
      <span class="toolbar-sep">·</span>
      <span>${structure}</span>

      ${
        variants.length > 1
          ? `
      <select id="variant-select" onchange="changeVariant(this.value)">
        ${variants
          .map(
            (v) => `
        <option value="${v.id}" ${v.id === variant ? 'selected' : ''}>${v.label}</option>`,
          )
          .join('')}
      </select>`
          : ''
      }

      <div class="viewport-btns">
        <button id="btn-desktop" class="active" onclick="setViewport('desktop')">
          🖥 Desktop
        </button>
        <button id="btn-tablet" onclick="setViewport('tablet')">
          📱 Tablet
        </button>
        <button id="btn-mobile" onclick="setViewport('mobile')">
          📲 Mobile
        </button>
      </div>
    </div>
  </div>

  <div class="preview-wrap viewport-desktop" id="preview-wrap">
    <p class="preview-label">
      blocks/${name}/${name}.js · decorate() · ${variant}
    </p>
    <div class="section">
      ${
        name === 'header'
          ? `<header><div class="nav-wrapper">${blockHTML}</div></header>`
          : name === 'footer'
            ? `<footer>${blockHTML}</footer>`
            : `<div>${blockHTML}</div>`
      }
    </div>
  </div>

  <script>window.__PREVIEW_SERVER = true</script>
  <script type="module">
    // ── URL params ────────────────────────────────────────────────────────
    const url = new URL(window.location)

    // Force ?mock=true for React blocks
    if (!url.searchParams.has('mock')) {
      url.searchParams.set('mock', 'true')
    }

    // Apply additional query params from the mock (e.g. ?error=true)
    ${
      extraParams
        ? extraParams
            .split('; ')
            .map((p) => {
              const [k, v] = p.split(', ');
              return `url.searchParams.set(${k}, ${v})`;
            })
            .join('\n    ')
        : ''
    }

    window.history.replaceState({}, '', url)

    // ── Cargar y ejecutar el decorate() real del bloque ───────────────────
    const blockEl = document.querySelector('[data-block-name="${name}"]')

    if (blockEl) {
      try {
        const isDev = true // Vite is always in dev mode here
        let mod

        // Try importing the JS directly (Vite resolves it in dev)
        // If it fails, fall back to the compiled bundle
        try {
          mod = await import('/blocks/${name}/${name}.js')
        } catch (importErr) {
          console.warn('[Preview] Fallback a bundle:', importErr.message)
          mod = await import('/blocks/${name}/${name}.bundle.js')
        }

        if (typeof mod.default === 'function') {
          await mod.default(blockEl)
          console.log('[Preview] ✓ ${name} decorated successfully')
        } else {
          console.warn('[Preview] Module does not export a default function')
        }
      } catch (err) {
        console.error('[Preview] Error in decorate():', err)
        blockEl.insertAdjacentHTML('beforebegin', \`
          <div class="error-card">
            <strong>Error en decorate()</strong>
            <pre>\${err.message}\\n\\n\${err.stack}</pre>
          </div>
        \`)
      }
    } else {
      console.warn('[Preview] Block element not found in the DOM')
    }

    // ── Viewport switcher ─────────────────────────────────────────────────
    window.setViewport = (size) => {
      const wrap = document.getElementById('preview-wrap')
      wrap.className = 'preview-wrap viewport-' + size
      document.querySelectorAll('.viewport-btns button').forEach((btn) => {
        btn.classList.toggle('active', btn.id === 'btn-' + size)
      })
      // Persist in sessionStorage
      sessionStorage.setItem('preview-viewport', size)
    }

    // Restore viewport from previous session
    const savedViewport = sessionStorage.getItem('preview-viewport')
    if (savedViewport) setViewport(savedViewport)

    // ── Cambio de variante ────────────────────────────────────────────────
    window.changeVariant = (variantId) => {
      const url = new URL(window.location)
      url.searchParams.set('variant', variantId)
      window.location.href = url.toString()
    }
  </script>
</body>
</html>`;
}

// ── Express app ──────────────────────────────────────────────────────────────

async function start() {
  const app = express();

  // Vite plugin: resolve *.bundle.js → *.jsx at analysis time.
  // Bundles are produced by `vite build`; in preview mode we redirect to the
  // source .jsx so Vite transforms it on-the-fly.
  const resolveBundleToJsx = {
    name: 'preview:resolve-bundle-to-jsx',
    resolveId(source, importer) {
      if (source.endsWith('.bundle.js')) {
        const jsxSource = source.replace(/\.bundle\.js$/, '.jsx');
        return this.resolve(jsxSource, importer, { skipSelf: true });
      }
    },
  };

  // Vite como middleware — sirve JS/CSS con HMR
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
    root: ROOT,
    logLevel: 'warn',
    plugins: [resolveBundleToJsx],
  });

  // Serve config page fixtures for local testing.
  // In production the EDS CDN serves these .plain.html pages.
  app.get('/config/:name\\.json', (req, res) => {
    const fixturePath = path.join(
      ROOT,
      'tests/fixtures/config',
      `${req.params.name}.json`,
    );
    try {
      const json = fs.readFileSync(fixturePath, 'utf-8');
      res.type('application/json').send(json);
    } catch {
      res
        .status(404)
        .json({ error: `Config fixture not found: ${req.params.name}` });
    }
  });

  app.use(vite.middlewares);

  // ── Hot reload para cambios en mocks (_block.json) ───────────────────────
  // Vite ya maneja HMR para JS/CSS. Acá escuchamos los JSON de mock y
  // disparamos un full-reload para que el HTML server-side se regenere.
  chokidarWatch(join(BLOCKS_DIR, '**/_*.json'), { ignoreInitial: true })
    .on('change', (file) => {
      const rel = file.replace(ROOT + '/', '');
      console.log(`[Preview] mock changed: ${rel} → reloading`);
      vite.ws.send({ type: 'full-reload' });
    })
    .on('add', (file) => {
      const rel = file.replace(ROOT + '/', '');
      console.log(`[Preview] mock added: ${rel} → reloading`);
      vite.ws.send({ type: 'full-reload' });
    });

  // Static files (CSS, images, .plain.html fragments, etc.)
  // Vite in custom mode does not serve static HTML — Express handles it directly
  app.use(express.static(ROOT));

  // API: block list (used by the dashboard for auto-refresh)
  app.get('/api/blocks', (req, res) => {
    const blocks = discoverBlocks();
    res.json(
      blocks.map(({ name, json }) => ({
        name,
        status: getBlockStatus({ name, json }),
        structure: json.eds?.structure ?? null,
        variants: getVariants(json.mock),
      })),
    );
  });

  // API: test results (populated at startup, re-runnable via POST)
  app.get('/api/test-results', (req, res) => {
    if (!testCache) {
      res.status(202).json({ status: 'pending' });
      return;
    }
    res.json(testCache);
  });

  app.post('/api/run-tests', async (req, res) => {
    const results = await runTests();
    res.json(results ?? { error: 'Tests failed to run' });
  });

  // ── Sidekick Library ─────────────────────────────────────────────────────
  // library.json — index of all ready blocks (fetched by <sidekick-library>).
  // The component expects { data: [...] } at the top level (not nested under "blocks").
  app.get('/tools/sidekick/library.json', (req, res) => {
    const blocks = discoverBlocks().filter(
      (b) => getBlockStatus(b) === 'ready',
    );
    res.json({
      data: blocks.map(({ name }) => ({
        name: name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        path: `/tools/sidekick/blocks/${name}`,
      })),
    });
  });

  // Block content pages — <sidekick-library> appends .plain.html to each path.
  // Returns raw EDS table HTML (one section per mock variant).
  app.get('/tools/sidekick/blocks/:blockName.plain.html', (req, res) => {
    const { blockName } = req.params;
    const blocks = discoverBlocks();
    const block = blocks.find((b) => b.name === blockName);

    if (!block) {
      res.status(404).send('');
      return;
    }

    const variants = getVariants(block.json.mock);
    const sections = variants
      .map(({ id, label }) => {
        const mockData = getMockForVariant(block.json.mock, id);
        const html = generateBlockHTML(blockName, block.json.eds, mockData);
        return `<div>\n  <!-- ${label} -->\n  ${html}\n</div>`;
      })
      .join('\n');

    // The sidekick-library plugin looks for sections as direct <div> children
    // of <body> (body.querySelectorAll(":scope > div")). Do NOT wrap in <main>.
    res.type('text/html').send(sections);
  });

  // Block container page — fetched by the sidekick-library block renderer as a
  // wrapper HTML document. It replaces <main> content with the block HTML and
  // renders it inside an iframe. Requires <header>, <main>, and <footer>.
  // Also works when visited directly: shows the block's default variant.
  app.get('/tools/sidekick/blocks/:blockName', (req, res) => {
    const { blockName } = req.params;
    const blocks = discoverBlocks();
    const block = blocks.find((b) => b.name === blockName);

    if (!block) {
      res
        .status(404)
        .send(
          `<html><body><p>Block "${blockName}" not found.</p></body></html>`,
        );
      return;
    }

    const mockData = getMockForVariant(block.json.mock, 'default');
    const blockHTML = generateBlockHTML(blockName, block.json.eds, mockData);
    res.type('text/html').send(renderContainerPage(blockName, blockHTML));
  });

  // Dashboard
  app.get('/', (req, res) => {
    const blocks = discoverBlocks();
    res.send(renderDashboard(blocks));
  });

  // Preview a block
  app.get('/preview/:blockName', (req, res) => {
    const { blockName } = req.params;
    const variant = req.query.variant ?? 'default';

    const blocks = discoverBlocks();
    const block = blocks.find((b) => b.name === blockName);

    if (!block) {
      res.status(404).send(`
        <h1>Bloque no encontrado</h1>
        <p>No existe blocks/${blockName}/_${blockName}.json</p>
        <a href="/">← Volver al dashboard</a>
      `);
      return;
    }

    const mockData = getMockForVariant(block.json.mock, variant);
    res.send(renderPreviewPage(block, variant, mockData));
  });

  app.listen(PORT, () => {
    const w = 42;
    const row = (s = '') => `  ║${s.padEnd(w)}║`;
    console.log([
      '',
      `  ╔${'═'.repeat(w)}╗`,
      row('  Block Preview Server'),
      row(),
      row(`  http://localhost:${PORT}`),
      row(),
      row('  Dashboard:  /'),
      row('  Preview:    /preview/<block-name>'),
      row('  API:        /api/blocks'),
      row('  SK Library: /tools/sidekick/library.html'),
      `  ╚${'═'.repeat(w)}╝`,
      '',
    ].join('\n'));

    // Run tests in background so the dashboard can show results
    console.log('  Running tests in background…');
    runTests().then((r) => {
      if (r) {
        const icon = r.failed > 0 ? '✗' : '✓';
        console.log(
          `  ${icon} Tests: ${r.passed} passed, ${r.failed} failed (${r.total} total)`,
        );
      }
    });
  });
}

start().catch((err) => {
  console.error('Error iniciando el servidor:', err);
  process.exit(1);
});
