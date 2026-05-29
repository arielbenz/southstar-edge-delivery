/**
 * templates/performance-page.js
 *
 * renderPerformancePage(scores) → HTML string
 * Sortable table + canvas bar chart of Lighthouse results across all blocks.
 */

export function renderPerformancePage(scores) {
  const rows = Object.entries(scores)
    .filter(([, d]) => d.status === 'done')
    .map(([block, d]) => ({ block, ...d.scores }));

  const tableRows = rows
    .map(
      (
        r,
      ) => `<tr data-block="${r.block}" data-perf="${r.performance}" data-a11y="${r.accessibility}" data-lcp="${r.lcp}">
      <td class="td-name"><a href="/preview/${r.block}?mock=true" class="block-link">${r.block}</a></td>
      <td class="td-score ${scoreClass(r.performance)}">${r.performance}</td>
      <td class="td-score ${scoreClass(r.accessibility)}">${r.accessibility}</td>
      <td class="td-lcp ${lcpClass(r.lcp)}">${(r.lcp / 1000).toFixed(2)}s</td>
      <td class="td-score ${scoreClass(r.cls * 100, true)}">${r.cls ?? '—'}</td>
    </tr>`,
    )
    .join('\n');

  const chartData = JSON.stringify(
    rows.map((r) => ({
      block: r.block,
      performance: r.performance,
      accessibility: r.accessibility,
    })),
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance — EDS Block Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
    
    /* Dark theme (default) */
    :root {
      --bg: #080c10;
      --surface: #0d1117;
      --panel: #111820;
      --border: rgba(255, 255, 255, 0.06);
      --border-h: rgba(255, 255, 255, 0.12);
      --text: #e6edf3;
      --muted: #7d8590;
      --accent: #e87722;
      --blue: #2f81f7;
      --green: #3fb950;
      --yellow: #d29922;
      --red: #f85149;
      --purple: #a371f7;
    }

    /* Light theme */
    [data-theme="light"] {
      --bg: #f8f9fe;
      --surface: #ffffff;
      --panel: #f3f4f9;
      --border: rgba(15, 23, 42, 0.08);
      --border-h: rgba(15, 23, 42, 0.15);
      --text: #0f172a;
      --muted: #64748b;
      --accent: #f97316;
      --blue: #3b82f6;
      --green: #10b981;
      --yellow: #f59e0b;
      --red: #ef4444;
      --purple: #8b5cf6;
    }

    html, body { 
      height: 100%; 
      background: var(--bg); 
      color: var(--text);
      font-family: 'DM Sans', system-ui, sans-serif; 
      font-size: 15px;
      -webkit-font-smoothing: antialiased; 
    }

    /* topbar */
    .topbar {
      display: flex; 
      align-items: center; 
      gap: 16px; 
      height: 100px;
      padding: 0 24px; 
      background: var(--surface);
      border-bottom: 1px solid var(--border); 
      position: sticky; 
      top: 0; 
      z-index: 100;
    }
    .topbar a { 
      color: var(--muted); 
      text-decoration: none; 
      font-size: 13px;
      font-weight: 500;
      transition: color 0.15s;
    }
    .topbar a:hover { color: var(--text) }
    .topbar-sep { width: 1px; height: 20px; background: var(--border-h) }
    .topbar-title { 
      font-size: 16px; 
      font-weight: 600;
      color: var(--text);
    }
    .topbar-spacer { flex: 1 }
    .btn {
      background: transparent; 
      border: 1px solid var(--border); 
      border-radius: 8px;
      color: var(--muted); 
      cursor: pointer; 
      font-family: inherit; 
      font-size: 13px;
      font-weight: 500;
      padding: 6px 14px;
      height: 36px;
      display: inline-flex;
      align-items: center;
      transition: all 0.15s;
    }
    .btn:hover { 
      background: var(--panel); 
      color: var(--text); 
      border-color: var(--border-h);
    }

    .main { 
      max-width: 1200px; 
      margin: 0 auto; 
      padding: 36px 32px;
    }

    /* table */
    .section-label {
      color: var(--muted); 
      font-size: 11px; 
      font-weight: 600;
      letter-spacing: 0.06em; 
      text-transform: uppercase; 
      margin-bottom: 16px;
    }
    .table-wrap { 
      overflow-x: auto; 
      border-radius: 12px; 
      border: 1px solid var(--border);
      background: var(--surface);
    }
    table { 
      width: 100%; 
      border-collapse: collapse;
    }
    thead th {
      background: var(--panel); 
      color: var(--muted);
      font-size: 11px; 
      font-weight: 600; 
      letter-spacing: 0.06em;
      text-transform: uppercase; 
      padding: 12px 16px; 
      text-align: left;
      border-bottom: 1px solid var(--border); 
      cursor: pointer; 
      user-select: none;
      white-space: nowrap;
      transition: color 0.15s;
    }
    thead th:hover { color: var(--text) }
    thead th.sorted { color: var(--accent) }
    thead th .sort-arrow { margin-left: 4px; opacity: 0.5 }
    thead th.sorted .sort-arrow { opacity: 1 }
    tbody tr { 
      border-bottom: 1px solid var(--border); 
      transition: background 0.1s;
    }
    tbody tr:last-child { border-bottom: none }
    tbody tr:hover { background: var(--panel) }
    tbody tr.best  td { background: rgba(63, 185, 80, 0.06) }
    tbody tr.worst td { background: rgba(248, 81, 73, 0.06) }
    [data-theme="light"] tbody tr.best  td { background: rgba(16, 185, 129, 0.08) }
    [data-theme="light"] tbody tr.worst td { background: rgba(239, 68, 68, 0.08) }
    td { padding: 12px 16px }
    .td-name { 
      font-family: 'DM Mono', monospace; 
      font-size: 13px;
    }
    .td-score { 
      font-family: 'DM Mono', monospace; 
      font-size: 14px; 
      font-weight: 500; 
      text-align: right;
    }
    .td-lcp { 
      font-family: 'DM Mono', monospace; 
      font-size: 14px; 
      font-weight: 500; 
      text-align: right;
    }
    .block-link { 
      color: var(--text); 
      text-decoration: none;
      transition: color 0.15s;
    }
    .block-link:hover { color: var(--accent) }
    .s-green  { color: var(--green) }
    .s-yellow { color: var(--yellow) }
    .s-red    { color: var(--red) }
    .s-muted  { color: var(--muted) }

    /* chart */
    .chart-section { margin-top: 36px }
    canvas { display: block; width: 100% }

    .empty { 
      color: var(--muted); 
      text-align: center; 
      padding: 64px; 
      font-size: 15px;
    }
  </style>
  <script>
    // Restore theme before first paint
    (function() {
      var theme = localStorage.getItem('eds-studio-theme') || 'dark';
      document.documentElement.dataset.theme = theme;
    })();
  </script>
</head>
<body>
  <header class="topbar">
    <a href="/">&larr; Dashboard</a>
    <div class="topbar-sep"></div>
    <span class="topbar-title">Performance</span>
    <div class="topbar-spacer"></div>
    <button class="btn" id="btn-theme" title="Toggle theme"></button>
    <button class="btn" onclick="exportCSV()">Export CSV</button>
  </header>

  <main class="main">
    ${
      rows.length === 0
        ? '<div class="empty">No audit data yet. Run audits from the dashboard.</div>'
        : `
    <div class="section-label">Lighthouse Results &mdash; ${rows.length} block${rows.length !== 1 ? 's' : ''}</div>
    <div class="table-wrap">
      <table id="perf-table">
        <thead>
          <tr>
            <th onclick="sortTable('block')">Block <span class="sort-arrow">&#8597;</span></th>
            <th onclick="sortTable('perf')" class="sorted">Perf <span class="sort-arrow">&#8595;</span></th>
            <th onclick="sortTable('a11y')">A11y <span class="sort-arrow">&#8597;</span></th>
            <th onclick="sortTable('lcp')">LCP <span class="sort-arrow">&#8597;</span></th>
            <th onclick="sortTable('cls')">CLS <span class="sort-arrow">&#8597;</span></th>
          </tr>
        </thead>
        <tbody id="table-body">
          ${tableRows}
        </tbody>
      </table>
    </div>

    <div class="chart-section">
      <div class="section-label" style="margin-top:0">Performance vs Accessibility</div>
      <canvas id="chart" height="320"></canvas>
    </div>
    `
    }
  </main>

<script>
  const CHART_DATA = ${chartData}
  let sortCol = 'perf'
  let sortDir = -1  // -1 = desc, 1 = asc

  // ── Sort table ─────────────────────────────────────────────────────────
  function sortTable(col) {
    if (sortCol === col) {
      sortDir *= -1
    } else {
      sortCol = col
      sortDir = col === 'block' ? 1 : -1
    }

    const tbody = document.getElementById('table-body')
    const rows  = Array.from(tbody.querySelectorAll('tr'))

    rows.sort((a, b) => {
      let av, bv
      if (col === 'block') {
        av = a.dataset.block; bv = b.dataset.block
        return sortDir * av.localeCompare(bv)
      } else if (col === 'perf') {
        av = +a.dataset.perf; bv = +b.dataset.perf
      } else if (col === 'a11y') {
        av = +a.dataset.a11y; bv = +b.dataset.a11y
      } else if (col === 'lcp') {
        av = +a.dataset.lcp; bv = +b.dataset.lcp
      } else if (col === 'cls') {
        av = parseFloat(a.querySelector('td:nth-child(5)').textContent)
        bv = parseFloat(b.querySelector('td:nth-child(5)').textContent)
      }
      return sortDir * (av - bv)
    })

    tbody.innerHTML = ''
    rows.forEach(r => tbody.appendChild(r))
    highlightBestWorst()

    document.querySelectorAll('thead th').forEach((th, i) => {
      th.classList.remove('sorted')
      const arrow = th.querySelector('.sort-arrow')
      if (arrow) arrow.textContent = '\\u2195'
    })

    const colIndex = { block: 0, perf: 1, a11y: 2, lcp: 3, cls: 4 }[col]
    const header = document.querySelectorAll('thead th')[colIndex]
    if (header) {
      header.classList.add('sorted')
      const arrow = header.querySelector('.sort-arrow')
      if (arrow) arrow.textContent = sortDir === -1 ? '\\u2193' : '\\u2191'
    }
  }

  function highlightBestWorst() {
    const rows = Array.from(document.querySelectorAll('#table-body tr'))
    if (rows.length < 2) return
    rows.forEach(r => r.classList.remove('best', 'worst'))
    const sorted = [...rows].sort((a, b) => +b.dataset.perf - +a.dataset.perf)
    sorted[0].classList.add('best')
    sorted[sorted.length - 1].classList.add('worst')
  }

  // ── Export CSV ─────────────────────────────────────────────────────────
  function exportCSV() {
    const rows = Array.from(document.querySelectorAll('#table-body tr'))
    const lines = ['Block,Performance,Accessibility,LCP (ms),CLS']
    rows.forEach(r => {
      const cols = r.querySelectorAll('td')
      lines.push([
        r.dataset.block,
        r.dataset.perf,
        r.dataset.a11y,
        r.dataset.lcp,
        cols[4]?.textContent ?? ''
      ].join(','))
    })
    const blob = new Blob([lines.join('\\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'lighthouse-results.csv'
    a.click()
  }

  // ── Canvas bar chart ───────────────────────────────────────────────────
  function drawChart() {
    const canvas = document.getElementById('chart')
    if (!canvas || !CHART_DATA.length) return
    const ctx    = canvas.getContext('2d')
    const dpr    = window.devicePixelRatio || 1
    const W      = canvas.parentElement.clientWidth
    const H      = 320
    canvas.width  = W * dpr
    canvas.height = H * dpr
    canvas.style.width  = W + 'px'
    canvas.style.height = H + 'px'
    ctx.scale(dpr, dpr)

    const paddingL = 140, paddingR = 24, paddingT = 16, paddingB = 8
    const barH     = 16, gap = 4
    const chartW   = W - paddingL - paddingR

    // Get theme colors
    const styles = getComputedStyle(document.documentElement)
    const mutedColor = styles.getPropertyValue('--muted').trim()
    const panelColor = styles.getPropertyValue('--panel').trim()
    const greenColor = styles.getPropertyValue('--green').trim()
    const yellowColor = styles.getPropertyValue('--yellow').trim()
    const redColor = styles.getPropertyValue('--red').trim()

    ctx.clearRect(0, 0, W, H)

    CHART_DATA.forEach((d, i) => {
      const y = paddingT + i * (barH * 2 + gap * 2 + 6)

      // Block name
      ctx.fillStyle = mutedColor
      ctx.font = '10px DM Mono, monospace'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(d.block, paddingL - 8, y + barH)

      // Perf bar
      const perfW  = (d.performance / 100) * chartW
      const perfColor = d.performance >= 90 ? greenColor : d.performance >= 70 ? yellowColor : redColor
      ctx.fillStyle = panelColor
      ctx.beginPath(); ctx.roundRect(paddingL, y, chartW, barH, 3); ctx.fill()
      ctx.fillStyle = perfColor
      ctx.beginPath(); ctx.roundRect(paddingL, y, perfW, barH, 3); ctx.fill()

      // Perf label
      ctx.fillStyle = perfColor
      ctx.font = '10px DM Mono, monospace'
      ctx.textAlign = 'left'
      ctx.fillText(d.performance, paddingL + perfW + 4, y + barH / 2)

      // A11y bar
      const a11yW  = (d.accessibility / 100) * chartW
      const a11yColor = d.accessibility >= 90 ? greenColor : d.accessibility >= 70 ? yellowColor : redColor
      ctx.fillStyle = panelColor
      ctx.beginPath(); ctx.roundRect(paddingL, y + barH + gap, chartW, barH, 3); ctx.fill()
      ctx.fillStyle = a11yColor
      ctx.beginPath(); ctx.roundRect(paddingL, y + barH + gap, a11yW, barH, 3); ctx.fill()
    })
  }

  highlightBestWorst()
  drawChart()
  window.addEventListener('resize', drawChart)

  // Theme toggle
  const MOON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const SUN_SVG  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  const themeBtn = document.getElementById('btn-theme');
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeBtn.innerHTML = theme === 'light' ? MOON_SVG : SUN_SVG;
    localStorage.setItem('eds-studio-theme', theme);
    drawChart(); // Redraw chart with new colors
  }
  applyTheme(localStorage.getItem('eds-studio-theme') || 'dark');
  themeBtn.addEventListener('click', function() {
    applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
  });
</script>
</body>
</html>`;
}

function scoreClass(v, isCls = false) {
  if (isCls) return v <= 10 ? 's-green' : v <= 25 ? 's-yellow' : 's-red';
  return v >= 90 ? 's-green' : v >= 70 ? 's-yellow' : 's-red';
}

function lcpClass(ms) {
  return ms < 1500 ? 's-green' : ms < 2500 ? 's-yellow' : 's-red';
}
