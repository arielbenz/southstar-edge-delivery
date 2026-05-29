/**
 * block-utils.js
 *
 * Shared utilities for the preview server:
 *  - Block discovery (filesystem)
 *  - Block status helpers
 *  - Vitest runner + cache
 */

import { execFile } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// ── Block discovery ───────────────────────────────────────────────────────────

export function discoverBlocks(blocksDir) {
  try {
    return readdirSync(blocksDir)
      .filter((name) => {
        try {
          return statSync(join(blocksDir, name)).isDirectory();
        } catch {
          return false;
        }
      })
      .map((name) => {
        const jsonPath = join(blocksDir, name, `_${name}.json`);
        try {
          const raw = readFileSync(jsonPath, 'utf-8');
          const json = JSON.parse(raw);
          return { name, json, jsonPath };
        } catch {
          // Block without _block.json — include it but without schema
          return { name, json: {}, jsonPath: null };
        }
      });
  } catch {
    return [];
  }
}

export function getBlockStatus(block) {
  const { json } = block;
  if (!json.eds && !json.mock) return 'no-json';
  if (!json.eds) return 'no-schema';
  if (!json.mock) return 'no-mock';
  return 'ready';
}

export function hasStories(blocksDir, blockName) {
  return existsSync(join(blocksDir, blockName, `${blockName}.stories.jsx`));
}

// ── Test runner ───────────────────────────────────────────────────────────────
// Shape: { total, passed, failed, byBlock: { [blockName]: { passed, failed } }, runAt }

let testCache = null;

export function getTestCache() {
  return testCache;
}

export function runTests(root) {
  return new Promise((resolve) => {
    execFile(
      'node',
      ['node_modules/.bin/vitest', 'run', '--reporter=json'],
      { cwd: root, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout) => {
        try {
          const data = JSON.parse(stdout);
          const byBlock = {};

          for (const suite of data.testResults ?? []) {
            // suite.name is an absolute path like /…/blocks/enrollment-flow/__tests__/X.test.jsx
            const rel = suite.name.replace(root + '/', '');
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
