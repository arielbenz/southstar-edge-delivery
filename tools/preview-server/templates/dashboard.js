/**
 * templates/dashboard.js
 *
 * renderDashboard(blocks, blocksDir) -> HTML string
 * Dark theme dashboard: topbar + sidebar + stats + block grid + Lighthouse polling.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getVariants } from '../html-generator.js';
import { getBlockStatus } from '../block-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(__dirname, 'styles', 'dashboard.css'), 'utf-8');

export function renderDashboard(blocks, blocksDir) {
  const ready = blocks.filter((b) => getBlockStatus(b) === 'ready');
  const reactBlocks = ready.filter(
    (b) => b.json?.eds?.type === 'react' || b.json?.eds?.structure === 'react',
  );
  const vanillaBlocks = ready.filter(
    (b) => b.json?.eds?.type !== 'react' && b.json?.eds?.structure !== 'react',
  );

  const blockCards = blocks
    .map((block) => {
      const status = getBlockStatus(block);
      const isReady = status === 'ready';
      const variants = isReady ? getVariants(block.json.mock) : [];
      const structure = block.json?.eds?.structure ?? '?';
      const type = block.json?.eds?.type ?? '';
      const structClass = [
        'simple',
        'container',
        'key-value',
        'react',
      ].includes(structure)
        ? structure
        : 'unknown';

      const variantChips =
        variants.length > 1
          ? variants
              .map((v) => '<span class="variant-chip">' + v.label + '</span>')
              .join('')
          : '<span class="variant-chip">default</span>';

      if (!isReady) {
        return (
          '<div class="block-card no-mock" data-block="' +
          block.name +
          '" data-structure="' +
          structClass +
          '" data-type="' +
          type +
          '">' +
          '<div class="block-card-body">' +
          '<div class="block-card-header">' +
          '<span class="block-name">' +
          block.name +
          '</span>' +
          '<span class="struct-badge ' +
          structClass +
          '">' +
          (structure === '?' ? 'unknown' : structure) +
          '</span>' +
          '</div>' +
          '</div>' +
          '<div class="no-mock-label">Add mock data to _' +
          block.name +
          '.json</div>' +
          '</div>'
        );
      }

      return (
        '<a class="block-card" href="/preview/' +
        block.name +
        '?mock=true&brand=southstar" data-block="' +
        block.name +
        '" data-structure="' +
        structClass +
        '" data-type="' +
        type +
        '">' +
        '<div class="block-card-body">' +
        '<div class="block-card-row-1">' +
        '<span class="block-name">' +
        block.name +
        '</span>' +
        '<button class="schema-btn" data-block-name="' +
        block.name +
        '" title="View schema" onclick="event.preventDefault(); event.stopPropagation(); viewSchema(\'' +
        block.name +
        '\')">&#123;&#125;</button>' +
        '</div>' +
        '<div class="block-card-row-2">' +
        '<span class="test-badge" data-block="' +
        block.name +
        '" style="display:none;"></span>' +
        '<span class="struct-badge ' +
        structClass +
        '">' +
        structure +
        '</span>' +
        '<button class="metrics-toggle" data-block="' +
        block.name +
        '" onclick="event.preventDefault(); event.stopPropagation(); toggleMetrics(\'' +
        block.name +
        '\')" title="Toggle metrics">&#9660;</button>' +
        '</div>' +
        '</div>' +
        '<div class="block-scores collapsed" data-block="' +
        block.name +
        '">' +
        '<div class="score-cell">' +
        '<div class="score-cell-label">PERF</div>' +
        '<div class="score-value sna score-perf">&mdash;</div>' +
        '<div class="score-bar"><div class="score-bar-fill bar-perf"></div></div>' +
        '</div>' +
        '<div class="score-cell">' +
        '<div class="score-cell-label">A11Y</div>' +
        '<div class="score-value sna score-a11y">&mdash;</div>' +
        '<div class="score-bar"><div class="score-bar-fill bar-a11y"></div></div>' +
        '</div>' +
        '<div class="score-cell">' +
        '<div class="score-cell-label">LCP</div>' +
        '<div class="score-value sna score-lcp">&mdash;</div>' +
        '<div class="score-bar"><div class="score-bar-fill bar-lcp"></div></div>' +
        '</div>' +
        '</div>' +
        '</a>'
      );
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Southstar - EDS Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/json.min.js"></script>
  <style>${CSS}</style>
</head>
<body>
<div class="layout">

  <header class="topbar">
    <a class="topbar-logo" href="/">
      <span class="logo-dot"></span>
      Southstar - EDS Studio
    </a>
    <div class="topbar-sep"></div>
    <span class="topbar-repo">southstar-eds-site / main</span>
    <div class="topbar-spacer"></div>
    <div class="topbar-search">
      <input id="search" type="search" placeholder="Search blocks&hellip;" autocomplete="off">
    </div>
    <button class="topbar-btn" onclick="location.reload()">&circlearrowleft; Refresh</button>
    <button class="topbar-btn theme-toggle" id="btn-theme" title="Toggle theme" aria-label="Toggle theme"></button>
    <button class="topbar-btn-accent" id="btn-run-all">&#9889; Run All Audits</button>
    <button class="topbar-btn" id="btn-run-tests">&#9881; Run Tests</button>
  </header>

  <nav class="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-label">Navigation</div>
      <div class="sidebar-item active" data-filter="all">
        All Blocks
        <span class="sidebar-item-count">${blocks.length}</span>
      </div>
      <div class="sidebar-item" data-filter="vanilla">
        Vanilla JS
        <span class="sidebar-item-count">${vanillaBlocks.length}</span>
      </div>
      <div class="sidebar-item" data-filter="react">
        React
        <span class="sidebar-item-count">${reactBlocks.length}</span>
      </div>
      <a class="sidebar-item" href="/performance">
        Performance
        <span class="sidebar-item-count">&rarr;</span>
      </a>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-label">Last Audit</div>
      <div class="audit-meta" id="audit-meta">No audit yet.</div>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-label">Test Results</div>
      <div class="test-summary" id="test-summary">No tests run yet.</div>
    </div>
  </nav>

  <main class="main">
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Avg. Performance</div>
        <div class="stat-value" id="stat-perf">&mdash;</div>
        <div class="stat-sub" id="stat-perf-sub">No data yet</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg. Accessibility</div>
        <div class="stat-value" id="stat-a11y">&mdash;</div>
        <div class="stat-sub" id="stat-a11y-sub">No data yet</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg. LCP</div>
        <div class="stat-value" id="stat-lcp">&mdash;</div>
        <div class="stat-sub" id="stat-lcp-sub">No data yet</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Blocks</div>
        <div class="stat-value" style="color:var(--text)">${blocks.length}</div>
        <div class="stat-sub">${vanillaBlocks.length} vanilla &middot; ${reactBlocks.length} react</div>
      </div>
    </div>

    <div class="run-banner" id="run-banner">
      <div>
        <div class="run-banner-text">Lighthouse audit running&hellip;</div>
        <div class="run-banner-sub" id="run-banner-sub">Starting&hellip;</div>
      </div>
      <div class="run-banner-progress">
        <div class="run-banner-fill" id="run-banner-fill"></div>
      </div>
      <button class="topbar-btn" onclick="cancelAudit()">Cancel</button>
    </div>

    <div class="section-header">
      <span class="section-title">Blocks</span>
      <div class="filter-pills">
        <button class="pill active" data-filter="all">All</button>
        <button class="pill" data-filter="simple">Simple</button>
        <button class="pill" data-filter="container">Container</button>
        <button class="pill" data-filter="key-value">Key-value</button>
      </div>
    </div>

    <div class="block-grid" id="block-grid">
      ${blockCards}
    </div>
  </main>
</div>

<!-- Schema Modal -->
<div class="schema-modal" id="schema-modal">
  <div class="schema-modal-overlay" onclick="closeSchemaModal()"></div>
  <div class="schema-modal-content">
    <div class="schema-modal-header">
      <span class="schema-modal-title" id="schema-modal-title">Schema</span>
      <button class="schema-modal-close" onclick="closeSchemaModal()">&times;</button>
    </div>
    <div class="schema-modal-body">
      <pre id="schema-content"><code class="language-json"></code></pre>
    </div>
  </div>
</div>

<script>
  var activeBrand = 'southstar';
  var auditRunning = false;
  var auditCancelled = false;
  var testResults = null;

  async function pollScores() {
    if (auditCancelled) return;
    try {
      var scores = await fetch('/api/scores').then(function(r) { return r.json(); });
      var running = 0, done = 0;
      var total = document.querySelectorAll('.block-card').length;
      var currentlyRunning = null;

      Object.keys(scores).forEach(function(block) {
        var data = scores[block];
        updateBlockCard(block, data);
        if (data.status === 'running') { running++; currentlyRunning = block; }
        if (data.status === 'done') done++;
      });

      var banner = document.getElementById('run-banner');
      var fill = document.getElementById('run-banner-fill');
      if (running > 0) {
        banner.style.display = 'flex';
        var current = done + running;
        document.getElementById('run-banner-sub').textContent =
          'Auditing ' + currentlyRunning + ' \u00b7 ' + current + ' / ' + total;
        fill.style.width = (total > 0 ? (done / total) * 100 : 0) + '%';
        auditRunning = true;
        setTimeout(pollScores, 2000);
      } else {
        banner.style.display = 'none';
        fill.style.width = '0%';
        if (auditRunning) { auditRunning = false; updateAuditMeta(scores); }
      }
      updateStats(scores);
    } catch(e) {}
  }

  function updateBlockCard(blockName, data) {
    var card = document.querySelector('[data-block="' + blockName + '"]');
    if (!card) return;
    var perfEl  = card.querySelector('.score-perf');
    var a11yEl  = card.querySelector('.score-a11y');
    var lcpEl   = card.querySelector('.score-lcp');
    var perfBar = card.querySelector('.bar-perf');
    var a11yBar = card.querySelector('.bar-a11y');
    var lcpBar  = card.querySelector('.bar-lcp');
    if (!perfEl) return;

    if (data.status === 'running') {
      perfEl.className = 'score-value running score-perf';
      perfEl.innerHTML = '<div class="spinner"></div> running';
      if (a11yEl) { a11yEl.className = 'score-value sna score-a11y'; a11yEl.textContent = '\u2014'; }
      if (lcpEl)  { lcpEl.className  = 'score-value sna score-lcp';  lcpEl.textContent  = '\u2014'; }
    } else if (data.status === 'done') {
      var s = data.scores;
      setScore(perfEl, perfBar, s.performance, 'score-perf');
      setScore(a11yEl, a11yBar, s.accessibility, 'score-a11y');
      setLCP(lcpEl, lcpBar, s.lcp);
      // Auto-expandir cuando hay datos
      var scoresEl = card.querySelector('.block-scores[data-block="' + blockName + '"]');
      if (scoresEl) {
        scoresEl.classList.remove('collapsed');
        var toggleBtn = document.querySelector('.metrics-toggle[data-block="' + blockName + '"]');
        if (toggleBtn) toggleBtn.innerHTML = '&#9650;';
      }
    } else if (data.status === 'error' || data.error) {
      perfEl.className = 'score-value score-perf';
      perfEl.style.color = 'var(--red)';
      perfEl.textContent = '!';
      perfEl.title = data.error;
    }
  }

  function setScore(el, bar, value, extraClass) {
    if (!el) return;
    var cls   = value >= 90 ? 's100' : value >= 70 ? 's90' : 's70';
    var color = value >= 90 ? 'var(--green)' : value >= 70 ? '#48B885' : 'var(--yellow)';
    el.className = 'score-value ' + cls + (extraClass ? ' ' + extraClass : '');
    el.textContent = value;
    if (bar) { bar.style.width = value + '%'; bar.style.background = color; }
  }

  function setLCP(el, bar, ms) {
    if (!el) return;
    var s     = (ms / 1000).toFixed(1) + 's';
    var cls   = ms < 1500 ? 's100' : ms < 2500 ? 's70' : 'sna';
    var color = ms < 1500 ? 'var(--green)' : ms < 2500 ? 'var(--yellow)' : 'var(--red)';
    el.className = 'score-value ' + cls + ' score-lcp';
    el.textContent = s;
    if (bar) { bar.style.width = Math.max(0, (1 - ms / 4000) * 100) + '%'; bar.style.background = color; }
  }

  function updateStats(scores) {
    var done = Object.values(scores).filter(function(s) { return s.status === 'done'; });
    if (!done.length) return;
    var avgPerf = Math.round(done.reduce(function(a, s) { return a + s.scores.performance; }, 0) / done.length);
    var avgA11y = Math.round(done.reduce(function(a, s) { return a + s.scores.accessibility; }, 0) / done.length);
    var avgLcp  = done.reduce(function(a, s) { return a + s.scores.lcp; }, 0) / done.length;
    var perfEl  = document.getElementById('stat-perf');
    var a11yEl  = document.getElementById('stat-a11y');
    var lcpEl   = document.getElementById('stat-lcp');
    perfEl.textContent = avgPerf;
    perfEl.className = 'stat-value ' + (avgPerf >= 90 ? 'green' : avgPerf >= 70 ? 'yellow' : 'red');
    document.getElementById('stat-perf-sub').textContent = done.length + ' blocks audited';
    a11yEl.textContent = avgA11y;
    a11yEl.className = 'stat-value ' + (avgA11y >= 90 ? 'green' : avgA11y >= 70 ? 'yellow' : 'red');
    document.getElementById('stat-a11y-sub').textContent = done.length + ' blocks audited';
    lcpEl.textContent = (avgLcp / 1000).toFixed(1) + 's';
    lcpEl.className = 'stat-value ' + (avgLcp < 1500 ? 'green' : avgLcp < 3000 ? 'yellow' : 'red');
    document.getElementById('stat-lcp-sub').textContent = 'avg across ' + done.length + ' blocks';
  }

  function updateAuditMeta(scores) {
    var done  = Object.values(scores).filter(function(s) { return s.status === 'done'; }).length;
    var total = Object.keys(scores).length;
    var now   = new Date().toLocaleTimeString();
    document.getElementById('audit-meta').innerHTML =
      '<strong>' + now + '</strong><br>' + done + ' / ' + total + ' passed';
  }

  function cancelAudit() {
    auditCancelled = true;
    auditRunning   = false;
    document.getElementById('run-banner').style.display = 'none';
  }

  document.getElementById('btn-run-all').addEventListener('click', function() {
    auditCancelled = false;
    fetch('/api/scores/run-all', { method: 'POST' });
    auditRunning = true;
    pollScores();
  });

  document.querySelectorAll('.brand-opt').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.brand-opt').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeBrand = btn.dataset.brand;
      document.querySelectorAll('.block-card[href]').forEach(function(card) {
        var url = new URL(card.href);
        url.searchParams.set('brand', activeBrand);
        card.href = url.toString();
      });
    });
  });

  document.querySelectorAll('.sidebar-item[data-filter]').forEach(function(item) {
    item.addEventListener('click', function() {
      document.querySelectorAll('.sidebar-item[data-filter]').forEach(function(i) { i.classList.remove('active'); });
      item.classList.add('active');
      var filter = item.dataset.filter;
      document.querySelectorAll('.block-card').forEach(function(card) {
        var s = card.dataset.structure;
        var t = card.dataset.type;
        var show = filter === 'all' ||
          (filter === 'vanilla' && t !== 'react') ||
          (filter === 'react' && t === 'react') ||
          s === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  document.querySelectorAll('.pill').forEach(function(pill) {
    pill.addEventListener('click', function() {
      document.querySelectorAll('.pill').forEach(function(p) { p.classList.remove('active'); });
      pill.classList.add('active');
      var filter = pill.dataset.filter;
      document.querySelectorAll('.block-card').forEach(function(card) {
        var show = filter === 'all' || 
          (filter === 'react' && card.dataset.type === 'react') ||
          card.dataset.structure === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  document.getElementById('search').addEventListener('input', function(e) {
    var term = e.target.value.toLowerCase();
    document.querySelectorAll('.block-card').forEach(function(card) {
      card.style.display = card.dataset.block.includes(term) ? '' : 'none';
    });
  });

  var lastCount = ${blocks.length};
  setInterval(async function() {
    try {
      var data = await fetch('/api/blocks').then(function(r) { return r.json(); });
      if (data.length !== lastCount) location.reload();
      lastCount = data.length;
    } catch(e) {}
  }, 5000);

  // Theme toggle
  var MOON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var SUN_SVG  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  var themeBtn = document.getElementById('btn-theme');
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeBtn.innerHTML = theme === 'light' ? MOON_SVG : SUN_SVG;
    localStorage.setItem('eds-studio-theme', theme);
  }
  applyTheme(localStorage.getItem('eds-studio-theme') || 'dark');
  themeBtn.addEventListener('click', function() {
    applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
  });

  // Schema modal
  window.viewSchema = async function(blockName) {
    var modal = document.getElementById('schema-modal');
    var title = document.getElementById('schema-modal-title');
    var content = document.getElementById('schema-content').querySelector('code');
    
    title.textContent = blockName + ' · Schema';
    content.textContent = 'Loading...';
    content.removeAttribute('data-highlighted');
    modal.classList.add('visible');
    
    try {
      var schema = await fetch('/api/blocks/' + blockName + '/schema').then(function(r) { return r.json(); });
      content.textContent = JSON.stringify(schema, null, 2);
      if (window.hljs) {
        hljs.highlightElement(content);
      }
    } catch(e) {
      content.textContent = 'Error loading schema: ' + e.message;
    }
  };

  window.closeSchemaModal = function() {
    document.getElementById('schema-modal').classList.remove('visible');
  };

  // Toggle metrics
  window.toggleMetrics = function(blockName) {
    var scoresEl = document.querySelector('.block-scores[data-block="' + blockName + '"]');
    var toggleBtn = document.querySelector('.metrics-toggle[data-block="' + blockName + '"]');
    if (scoresEl) {
      scoresEl.classList.toggle('collapsed');
      if (toggleBtn) {
        toggleBtn.innerHTML = scoresEl.classList.contains('collapsed') ? '&#9660;' : '&#9650;';
      }
    }
  };

  // Close modal with ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeSchemaModal();
  });

  // Load test results on page load
  async function loadTestResults() {
    try {
      var res = await fetch('/api/test-results');
      testResults = await res.json();
      updateTestDisplay();
    } catch(e) {
      console.error('Failed to load test results:', e);
    }
  }

  function updateTestDisplay() {
    if (!testResults) return;
    
    // Update sidebar summary
    var summary = document.getElementById('test-summary');
    if (testResults.total === 0) {
      summary.textContent = 'No tests found.';
      summary.className = 'test-summary';
    } else {
      var passedText = testResults.passed + ' passed';
      var failedText = testResults.failed > 0 ? ', ' + testResults.failed + ' failed' : '';
      summary.innerHTML = '<span class="test-total">' + testResults.total + ' tests</span><br>' +
        '<span class="test-passed">&#10003; ' + passedText + failedText + '</span>';
      summary.className = 'test-summary ' + (testResults.failed > 0 ? 'has-failures' : 'all-passed');
    }
    
    // Update block badges
    document.querySelectorAll('.test-badge').forEach(function(badge) {
      var blockName = badge.dataset.block;
      var blockTests = testResults.byBlock[blockName];
      if (blockTests) {
        var total = blockTests.passed + blockTests.failed;
        if (blockTests.failed > 0) {
          badge.textContent = '✗ ' + blockTests.failed + ' failed';
          badge.className = 'test-badge failed';
        } else {
          badge.textContent = '✓ ' + total + ' passed';
          badge.className = 'test-badge passed';
        }
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  // Run tests button
  document.getElementById('btn-run-tests').addEventListener('click', async function() {
    var btn = this;
    btn.disabled = true;
    btn.textContent = '⚙ Running...';
    try {
      var res = await fetch('/api/run-tests', { method: 'POST' });
      testResults = await res.json();
      updateTestDisplay();
      btn.textContent = '⚙ Run Tests';
    } catch(e) {
      console.error('Failed to run tests:', e);
      btn.textContent = '⚙ Run Tests (Error)';
    }
    btn.disabled = false;
  });

  pollScores();
  loadTestResults();
</script>
</body>
</html>`;
}
