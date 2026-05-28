/**
 * scripts/build-models.js
 *
 * Assembles component-definitions.json, component-models.json, and
 * component-filters.json from per-block _*.json source files.
 *
 * Source of truth:
 *   - blocks/**\/_*.json        → each block owns its definitions/models/filters
 *   - models/shared.json        → page-level items (section model, main filter)
 *
 * Only keys `definitions`, `models`, and `filters` are read; `eds` and `mock`
 * are tooling-only and ignored.
 *
 * Usage: node scripts/build-models.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const BLOCKS_DIR = join(ROOT, 'blocks');
const SHARED_FILE = join(ROOT, 'models', 'shared.json');

/** Normalise a value to an array (single object or existing array). */
function toArray(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

const allDefinitions = [];
const allModels = [];
const allFilters = [];

console.log('🔧  Building content models from _block.json files...\n');

// ── 1. Collect from each block ──────────────────────────────────────────────
const blockJsonPaths = await glob('blocks/**/_*.json', { cwd: ROOT });
blockJsonPaths.sort();

let processed = 0;
let errors = 0;

for (const rel of blockJsonPaths) {
  const absPath = join(ROOT, rel);
  try {
    const data = JSON.parse(readFileSync(absPath, 'utf-8'));
    const defs = toArray(data.definitions);
    const models = toArray(data.models);
    const filters = toArray(data.filters);
    allDefinitions.push(...defs);
    allModels.push(...models);
    allFilters.push(...filters);
    console.log(
      `  ✅  ${rel.padEnd(45)} defs:${defs.length}  models:${models.length}  filters:${filters.length}`,
    );
    processed++;
  } catch (err) {
    console.error(`  ❌  ${rel}: ${err.message}`);
    errors++;
  }
}

// ── 2. Collect page-level shared items ──────────────────────────────────────
if (existsSync(SHARED_FILE)) {
  try {
    const shared = JSON.parse(readFileSync(SHARED_FILE, 'utf-8'));
    allDefinitions.push(...toArray(shared.definitions));
    allModels.push(...toArray(shared.models));
    allFilters.push(...toArray(shared.filters));
    console.log(`  ✅  models/shared.json (page-level items)`);
    processed++;
  } catch (err) {
    console.error(`  ❌  models/shared.json: ${err.message}`);
    errors++;
  }
}

// ── 3. Write output files ────────────────────────────────────────────────────
const outputs = [
  { file: 'component-definitions.json', data: allDefinitions },
  { file: 'component-models.json', data: allModels },
  { file: 'component-filters.json', data: allFilters },
];

console.log('');
for (const { file, data } of outputs) {
  try {
    writeFileSync(
      join(ROOT, file),
      JSON.stringify(data, null, 2) + '\n',
      'utf-8',
    );
    console.log(`  📄  ${file} (${data.length} entries)`);
  } catch (err) {
    console.error(`  ❌  Could not write ${file}: ${err.message}`);
    errors++;
  }
}

console.log(
  `\n📊  Summary: ${processed} source files processed, ${errors} errors.`,
);

if (errors > 0) {
  process.exit(1);
}
