/**
 * Block Preview Server — entry point
 *
 * Responsibilities (only):
 *  - Create the Express + Vite middleware stack
 *  - Wire HTTP routes to template/utility helpers
 *  - Start chokidar for mock JSON hot-reload
 *  - Launch the HTTP server and run tests in the background
 *
 * Local dev: npm run preview → http://localhost:5175
 * Hot reload:
 *  - JS / CSS  → Vite HMR (automatic)
 *  - _*.json   → chokidar full-reload
 *  - server    → node --watch (package.json script)
 */

import express from 'express';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { createServer as createViteServer } from 'vite';
import { watch as chokidarWatch } from 'chokidar';

import {
  discoverBlocks,
  getBlockStatus,
  getTestCache,
  runTests,
} from './block-utils.js';
import {
  generateBlockHTML,
  getMockForVariant,
  getVariants,
} from './html-generator.js';
import { renderDashboard } from './templates/dashboard.js';
import { renderPreviewPage } from './templates/preview-page.js';
import { renderContainerPage } from './templates/container-page.js';
import { renderPerformancePage } from './templates/performance-page.js';
import { runLighthouse } from './lighthouse-runner.js';
import {
  getScore,
  setRunning,
  setDone,
  setError,
  getAllScores,
} from './scores-cache.js';

const ROOT = resolve(process.cwd());
const BLOCKS_DIR = join(ROOT, 'blocks');
const PORT = 5175;

async function start() {
  const app = express();

  // Vite plugin: resolve *.bundle.js → *.jsx so Vite transforms JSX on-the-fly
  // in dev mode instead of requiring a pre-built bundle.
  const resolveBundleToJsx = {
    name: 'preview:resolve-bundle-to-jsx',
    resolveId(source, importer) {
      if (source.endsWith('.bundle.js')) {
        const jsxSource = source.replace(/\.bundle\.js$/, '.jsx');
        return this.resolve(jsxSource, importer, { skipSelf: true });
      }
    },
  };

  // Vite as Express middleware — serves JS/CSS with HMR
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
    root: ROOT,
    logLevel: 'warn',
    plugins: [resolveBundleToJsx],
  });

  // Serve config-page fixtures for local testing
  app.get('/config/:name\\.json', (req, res) => {
    const fixturePath = join(
      ROOT,
      'tests/fixtures/config',
      req.params.name + '.json',
    );
    try {
      const json = readFileSync(fixturePath, 'utf-8');
      res.type('application/json').send(json);
    } catch {
      res
        .status(404)
        .json({ error: 'Config fixture not found: ' + req.params.name });
    }
  });

  app.use(vite.middlewares);

  // ── Brand token files ────────────────────────────────────────────────────
  app.get('/styles/brands/:brand/tokens.css', (req, res) => {
    const filePath = join(
      ROOT,
      'styles',
      'brands',
      req.params.brand,
      'tokens.css',
    );
    res.type('text/css').sendFile(filePath, (err) => {
      if (err)
        res
          .status(404)
          .send(`/* Brand tokens not found: ${req.params.brand} */`);
    });
  });

  // ── Hot reload for mock JSON changes
  // Vite already handles HMR for JS/CSS. Here we watch _*.json files and send
  // a full-reload so the server-side HTML is regenerated with fresh mock data.
  chokidarWatch(join(BLOCKS_DIR, '**/_*.json'), { ignoreInitial: true })
    .on('change', (file) => {
      console.log(
        '[Preview] mock changed: ' +
          file.replace(ROOT + '/', '') +
          ' → reloading',
      );
      vite.ws.send({ type: 'full-reload' });
    })
    .on('add', (file) => {
      console.log(
        '[Preview] mock added: ' +
          file.replace(ROOT + '/', '') +
          ' → reloading',
      );
      vite.ws.send({ type: 'full-reload' });
    });

  // Static files (CSS, fonts, images, .plain.html fragments…)
  app.use(express.static(ROOT));

  // ── API ──────────────────────────────────────────────────────────────────

  app.get('/api/blocks', (req, res) => {
    const blocks = discoverBlocks(BLOCKS_DIR);
    res.json(
      blocks.map(({ name, json }) => ({
        name,
        status: getBlockStatus({ name, json }),
        structure: json.eds?.structure ?? null,
        variants: getVariants(json.mock),
      })),
    );
  });

  app.get('/api/blocks/:blockName/schema', (req, res) => {
    const { blockName } = req.params;
    const schemaPath = join(BLOCKS_DIR, blockName, `_${blockName}.json`);
    try {
      const schema = readFileSync(schemaPath, 'utf-8');
      res.type('application/json').send(schema);
    } catch {
      res.status(404).json({ error: 'Schema not found' });
    }
  });

  app.get('/api/test-results', (req, res) => {
    const cache = getTestCache();
    if (!cache) {
      res.status(202).json({ status: 'pending' });
      return;
    }
    res.json(cache);
  });

  app.post('/api/run-tests', async (req, res) => {
    const results = await runTests(ROOT);
    res.json(results ?? { error: 'Tests failed to run' });
  });

  // ── Lighthouse scores ────────────────────────────────────────────────────

  app.get('/api/scores', (req, res) => {
    res.json(getAllScores());
  });

  app.get('/api/scores/:blockName', (req, res) => {
    res.json(getScore(req.params.blockName));
  });

  // Must be registered before /:blockName/run to avoid segment ambiguity
  app.post('/api/scores/run-all', (req, res) => {
    const blocks = discoverBlocks(BLOCKS_DIR).filter((b) => b.json.mock);
    res.json({ status: 'started', count: blocks.length });

    // Run in series to avoid saturating Chrome
    (async () => {
      for (const block of blocks) {
        setRunning(block.name);
        try {
          const url =
            'http://localhost:' +
            PORT +
            '/preview/' +
            block.name +
            '?mock=true';
          const scores = await runLighthouse(url);
          setDone(block.name, scores);
        } catch (err) {
          setError(block.name, err);
        }
      }
    })();
  });

  app.post('/api/scores/:blockName/run', (req, res) => {
    const { blockName } = req.params;
    const current = getScore(blockName);

    if (current.status === 'running') {
      res.json({ status: 'already-running' });
      return;
    }

    setRunning(blockName);
    res.json({ status: 'started' });

    const url =
      'http://localhost:' + PORT + '/preview/' + blockName + '?mock=true';
    runLighthouse(url)
      .then((scores) => setDone(blockName, scores))
      .catch((err) => setError(blockName, err));
  });

  // ── Sidekick Library ──────────────────────────────────────────────────────

  // Index of all ready blocks (fetched by <sidekick-library> component)
  app.get('/tools/sidekick/library.json', (req, res) => {
    const blocks = discoverBlocks(BLOCKS_DIR).filter(
      (b) => getBlockStatus(b) === 'ready',
    );
    res.json({
      data: blocks.map(({ name }) => ({
        name: name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        path: '/tools/sidekick/blocks/' + name,
      })),
    });
  });

  // Raw EDS table HTML — one section per mock variant
  app.get('/tools/sidekick/blocks/:blockName.plain.html', (req, res) => {
    const { blockName } = req.params;
    const block = discoverBlocks(BLOCKS_DIR).find((b) => b.name === blockName);
    if (!block) {
      res.status(404).send('');
      return;
    }

    const variants = getVariants(block.json.mock);
    const sections = variants
      .map(({ id, label }) => {
        const mockData = getMockForVariant(block.json.mock, id);
        const html = generateBlockHTML(blockName, block.json.eds, mockData);
        return '<div>\n  <!-- ' + label + ' -->\n  ' + html + '\n</div>';
      })
      .join('\n');

    res.type('text/html').send(sections);
  });

  // Container page — fetched by the sidekick-library block renderer as a
  // wrapper document; also works when visited directly in the browser.
  app.get('/tools/sidekick/blocks/:blockName', (req, res) => {
    const { blockName } = req.params;
    const block = discoverBlocks(BLOCKS_DIR).find((b) => b.name === blockName);

    if (!block) {
      res
        .status(404)
        .send(
          '<html><body><p>Block not found: ' + blockName + '</p></body></html>',
        );
      return;
    }

    const mockData = getMockForVariant(block.json.mock, 'default');
    const blockHTML = generateBlockHTML(blockName, block.json.eds, mockData);
    res.type('text/html').send(renderContainerPage(blockName, blockHTML));
  });

  // ── Pages ─────────────────────────────────────────────────────────────────

  // Dashboard
  app.get('/', (req, res) => {
    const blocks = discoverBlocks(BLOCKS_DIR);
    res.send(renderDashboard(blocks, BLOCKS_DIR));
  });

  // Performance page
  app.get('/performance', (req, res) => {
    res.send(renderPerformancePage(getAllScores()));
  });

  // Block preview
  app.get('/preview/:blockName', (req, res) => {
    const { blockName } = req.params;
    const variant = req.query.variant ?? 'default';
    const block = discoverBlocks(BLOCKS_DIR).find((b) => b.name === blockName);

    if (!block) {
      res
        .status(404)
        .send(
          '<h1>Block not found</h1>' +
            '<p>No blocks/' +
            blockName +
            '/_' +
            blockName +
            '.json found.</p>' +
            '<a href="/">← Back to dashboard</a>',
        );
      return;
    }

    const mockData = getMockForVariant(block.json.mock, variant);
    const brand = req.query.brand ?? 'southstar';
    res.send(renderPreviewPage(block, variant, mockData, brand));
  });

  app.listen(PORT, () => {
    const w = 42;
    const row = (s = '') => '  \u2551' + s.padEnd(w) + '\u2551';
    console.log(
      [
        '',
        '  \u2554' + '\u2550'.repeat(w) + '\u2557',
        row('  Block Preview Server'),
        row(),
        row('  http://localhost:' + PORT),
        row(),
        row('  Dashboard:  /'),
        row('  Preview:    /preview/<block-name>'),
        row('  API:        /api/blocks'),
        row('  SK Library: /tools/sidekick/library.html'),
        '  \u255a' + '\u2550'.repeat(w) + '\u255d',
        '',
      ].join('\n'),
    );

    console.log('  Running tests in background\u2026');
    runTests(ROOT).then((r) => {
      if (r) {
        const icon = r.failed > 0 ? '\u2717' : '\u2713';
        console.log(
          '  ' +
            icon +
            ' Tests: ' +
            r.passed +
            ' passed, ' +
            r.failed +
            ' failed (' +
            r.total +
            ' total)',
        );
      }
    });
  });
}

start().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
