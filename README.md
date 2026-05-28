# SouthStar EDS Site

AEM Edge Delivery Services (EDS) site for Ohio Natural Gas / SouthStar Energy Services, built with the standard EDS boilerplate plus custom tooling for local block development.

Content is sourced from Document Authoring (DA) at `https://content.da.live/ohio-natural-gas/main`.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Getting Started](#getting-started)
3. [How EDS Works](#how-eds-works)
4. [Blocks](#blocks)
5. [Scripts](#scripts)
6. [Block Parser](#block-parser)
7. [Preview Server](#preview-server)
8. [Sidekick Library](#sidekick-library)
9. [Content Models](#content-models)
10. [Storybook](#storybook)
11. [Testing](#testing)

---

## Project Structure

```
southstar-edge-delivery/
├── blocks/                  # One folder per block
│   ├── hero/
│   │   ├── hero.js          # decorate() function
│   │   ├── hero.css         # Block styles
│   │   └── _hero.json       # Schema + mock data (local tooling only)
│   └── ...
├── models/                  # Universal Editor content models (source of truth)
│   ├── component-definitions.json
│   ├── component-filters.json
│   └── component-models.json
├── scripts/
│   ├── scripts.js           # EDS page initialization
│   ├── aem.js               # EDS core library (boilerplate)
│   ├── delayed.js           # Non-critical deferred scripts
│   ├── build-models.js      # Copies models/ → root for EDS/UE
│   ├── preview-server/      # Local block preview server
│   └── utils/               # Shared utilities
│       ├── block-parser.js  # Parses EDS block DOM → structured data
│       ├── dom.js
│       ├── auth.js
│       └── react-loader.js
├── styles/                  # Global CSS (tokens, layout, lazy styles)
├── tools/
│   └── sidekick/
│       ├── library.html     # Sidekick Library UI (served locally)
│       └── plugins/         # Custom Sidekick plugins
├── tests/                   # Unit and integration tests
├── fstab.yaml               # Content source mount (DA)
└── head.html                # <head> additions injected by EDS
```

---

## Getting Started

**Prerequisites:** Node.js 20+ (see `.nvmrc`).

```bash
npm install

# Start EDS development server (aem-cli, port 3000)
npm run dev

# Start block preview server (Express + Vite, port 5175)
npm run preview

# Run unit tests
npm test

# Build React block bundles
npm run build

# Copy models/ to project root (required before UE deployment)
npm run build:models
```

---

## How EDS Works

AEM Edge Delivery Services turns Google Docs / DA documents into HTML pages.  
The pipeline is:

```
DA document → .plain.html → EDS decorates → blocks run → final page
```

1. Each section in a document becomes a `<div class="section">` inside `<main>`.
2. Tables inside sections become **blocks** — the table name becomes the CSS class, rows become `<div>` rows, cells become nested `<div>` pairs.
3. EDS calls `decorate(block)` for each block found on the page.

**Page lifecycle** (controlled by `scripts/scripts.js`):

| Phase   | Function        | Purpose                                                    |
| ------- | --------------- | ---------------------------------------------------------- |
| Eager   | `loadEager()`   | Decorate `<main>`, load the first section — impacts LCP    |
| Lazy    | `loadLazy()`    | Load header, footer, remaining sections, non-critical CSS  |
| Delayed | `loadDelayed()` | Analytics, third-party scripts, anything that can wait 3 s |

---

## Blocks

Each block lives in its own folder under `blocks/`. A block must export a `decorate(block)` function.

```
blocks/accordion/
├── accordion.js    # export default async function decorate(block) { ... }
├── accordion.css   # Scoped styles, loaded automatically by EDS
└── _accordion.json # Schema + mock data (used by local tooling only)
```

### The `_block.json` file

Every block that needs local preview or content-model integration must have a `_block.json` with two top-level sections:

```json
{
  "eds":  { ... },   // How to read the DOM in production
  "mock": [ ... ]    // Fake data for local development
}
```

#### `eds` section — DOM schema

Describes how EDS will render the block's content. Three structures are supported:

**`simple`** — each field maps to a specific row and column index:

```json
{
  "structure": "simple",
  "fields": [
    { "name": "title", "row": 0, "col": 0, "type": "text" },
    { "name": "body", "row": 1, "col": 0, "type": "html" },
    { "name": "ctaUrl", "row": 2, "col": 0, "type": "link" }
  ]
}
```

**`key-value`** — each row is a pair: `col 0` = key label, `col 1` = value:

```json
{
  "structure": "key-value",
  "fields": [
    { "name": "heading", "key": "heading", "type": "text" },
    { "name": "subtitle", "key": "subtitle", "type": "html" }
  ]
}
```

**`container`** — N header rows followed by repeating item rows:

```json
{
  "structure": "container",
  "headerRows": 1,
  "headerFields": [
    { "name": "heading", "col": 0, "type": "text" },
    { "name": "description", "col": 1, "type": "html" }
  ],
  "itemFields": [
    { "name": "title", "col": 0, "type": "html" },
    { "name": "content", "col": 1, "type": "html" }
  ]
}
```

#### Supported field types

| Type      | Description                                             |
| --------- | ------------------------------------------------------- |
| `text`    | Plain text content (`textContent`)                      |
| `html`    | Raw inner HTML (`innerHTML`)                            |
| `number`  | Parsed float                                            |
| `boolean` | `true` if the text is literally `"true"`                |
| `list`    | Array from `<li>` elements, or comma-separated fallback |
| `link`    | `href` from the first `<a>`, or text fallback           |
| `image`   | `{ src, alt }` from the first `<img>`                   |
| `picture` | The `<picture>` element itself (or `<img>` fallback)    |

#### `mock` section — fake data for preview

An array of variant objects. Each variant is used by the preview server to generate a realistic preview without needing a real page.

```json
{
  "mock": [
    {
      "_variant": "default", // Unique ID — used in ?variant= query param
      "_label": "Default", // Human-readable name shown in the UI
      "_meta": {
        // (optional) <meta> tags injected in <head>
        "prime-token": "abc123"
      },
      "_queryParams": {
        // (optional) extra query params added to URL
        "error": "true"
      },
      "classes": ["urgent"], // Extra CSS classes added to the block element
      "heading": "Example title", // Content fields — names match schema fields
      "body": "<p>Hello</p>",
      "items": [
        // For container blocks
        { "title": "Item 1", "content": "<p>...</p>" }
      ]
    }
  ]
}
```

---

## Scripts

### `scripts/scripts.js`

The main entry point. Imported by every page on the site. Responsibilities:

- Imports helpers from `aem.js` and project utilities.
- Defines `decoratePage()` → calls `decorateTemplateAndTheme()`, `buildAutoBlocks()`, `decorateSections()`, `decorateBlocks()`.
- Runs `buildHeroBlock()`: if the first section has an `<h1>` and a `<picture>` in the same section without an existing `.hero` block, it wraps them in an auto-block.
- Orchestrates the three lifecycle phases (`loadEager` → `loadLazy` → `loadDelayed`).
- Exports `decorateMain()` for use by the `fragment` block.
- Skips `loadPage()` when running inside the preview server (`window.__PREVIEW_SERVER`).

### `scripts/aem.js`

The EDS core library (maintained by Adobe). Key exports used in the project:

| Export                       | Purpose                                          |
| ---------------------------- | ------------------------------------------------ |
| `decorateBlocks(main)`       | Adds `block` class, wraps cells                  |
| `decorateSections(main)`     | Adds `section` class, handles section metadata   |
| `decorateIcons(el)`          | Replaces `:icon-name:` spans with `<img>`        |
| `loadBlock(block)`           | Imports and runs a block's `decorate()`          |
| `loadSection(section, fn)`   | Loads one section eagerly                        |
| `loadSections(main)`         | Loads all remaining sections lazily              |
| `loadHeader(header)`         | Loads the `header` block                         |
| `loadFooter(footer)`         | Loads the `footer` block                         |
| `getMetadata(name)`          | Reads `<meta name="...">` from the document      |
| `buildBlock(name, content)`  | Programmatically creates a block element         |
| `loadCSS(href)`              | Dynamically appends a `<link rel="stylesheet">`  |
| `waitForFirstImage(section)` | Resolves when the first image in a section loads |
| `sampleRUM(...)`             | Real User Monitoring telemetry                   |

### `scripts/delayed.js`

Loaded 3 seconds after `loadLazy` completes. Place analytics tags, chat widgets, and any non-essential third-party scripts here.

### `scripts/build-models.js`

```bash
npm run build:models
```

Reads the three JSON files in `models/`, validates them, and writes pretty-printed copies to the project root. This is required because EDS and Universal Editor expect the model files at the root, but `models/` is kept as the single source of truth during development.

### `scripts/utils/dom.js`

Helpers for origin/href detection that work both in a real browser window and inside a Sidekick Library `srcdoc` iframe (where `window.location` reflects the parent origin).

---

## Block Parser

**`scripts/utils/block-parser.js`**

### The problem it solves

When EDS renders a page, every block ends up as a table-shaped DOM structure: rows of `<div>` elements, each containing one or more cell `<div>` pairs. The content inside those cells is raw HTML — a mix of text nodes, `<p>`, `<a>`, `<picture>`, and `<ul>` elements depending on what the author typed in the Google Doc.

Without a parser, every block's `decorate()` function would need to contain the same repetitive DOM-walking code:

```js
// Without block-parser — manual, brittle
export default function decorate(block) {
  const rows = [...block.children];
  const heading = rows[0]?.children[0]?.textContent?.trim();
  const rate = parseFloat(rows[1]?.children[1]?.textContent?.trim());
  const items = [...rows].slice(2).map((row) => ({
    title: row.children[0]?.textContent?.trim(),
    content: row.children[1]?.innerHTML?.trim(),
  }));
  // ...
}
```

This is hard to maintain: any change to the table structure means hunting down the magic index numbers in the JS. It is also impossible to test without a real DOM.

`block-parser.js` solves this by separating the **structural description** (in `_block.json`) from the **traversal logic** (in the parser). The block only describes _what_ it expects; the parser handles _how_ to read it.

```js
// With block-parser — declarative, testable
import { parseBlock } from '../utils/block-parser.js';
import schema from './_plans.json' assert { type: 'json' };

export default function decorate(block) {
  const { heading, items } = parseBlock(block, schema.eds);
  // heading: string, items: [{ planName, rate, term, features, featured }, ...]
}
```

### Benefits

- **No magic index numbers** — field positions are declared once in the schema, not scattered throughout the code.
- **Type coercion is automatic** — `number` fields come back as JS numbers, `boolean` as booleans, `list` as arrays. No manual `parseFloat` or `=== 'true'` checks.
- **Consistent null handling** — if a cell is missing (author left a field blank), the value is `null` rather than `undefined` or an exception.
- **Works on detached DOM** — uses `element.children` instead of `:scope > div` selectors, so it works on elements that haven't been inserted into the document yet (important for tests).
- **Reusable across all blocks** — one utility, one test suite, used by every block that needs structured data.
- **Single source of truth** — the same `_block.json` schema that describes the DOM structure is also used by the preview server to _generate_ that structure, so schema and parser are always in sync.

### How it works internally

`parseBlock(blockEl, schema)` first collects all direct `<div>` children of the block as rows, then dispatches to one of three parsers based on `schema.structure`:

#### `simple` — fixed row/column positions

Each field points to an exact `[row, col]` coordinate in the table:

```json
{ "name": "title", "row": 0, "col": 0, "type": "text" }
```

The parser picks `rows[field.row].children[field.col]` and extracts the value. Fields that point to missing rows/cells come back as `null`.

```
Block DOM                        Result
─────────────────────────        ─────────────────────────
row 0 │ "Fixed Rate Plan"   →    title: "Fixed Rate Plan"
row 1 │ "11.9" │ "¢/CCF"   →    rate: 11.9
row 2 │ "/enroll"           →    ctaUrl: "/enroll"
```

#### `key-value` — label / value pairs

Each row is a pair: the first cell is the key label, the second is the value. This structure is flexible — the author can add or reorder rows without breaking the block, as long as the labels stay consistent:

```
Block DOM                        Result
─────────────────────────        ─────────────────────────
"Heading"    │ "Get a Quote" →   heading: "Get a Quote"
"Subtitle"   │ "<p>...</p>"  →   subtitle: "<p>...</p>"
"CTA URL"    │ "/enroll"     →   ctaUrl: "/enroll"
```

The parser normalizes the key label (lowercased, spaces → hyphens) and maps it to the field via `field.key` or the auto-kebab-cased field name. Unknown labels are silently ignored.

#### `container` — header rows + repeating item rows

The most common structure for blocks that display a list of things (plans, accordion items, features). The first `headerRows` rows are treated as the header; every remaining row is one item:

```
Block DOM                               Result
────────────────────────────────        ───────────────────────────────────
row 0 │ "Our Plans" │ "<p>...</p>"  →   heading: "Our Plans"
row 1 │ "Fixed 12"  │ "11.9" │ …   →   items[0]: { planName, rate, term }
row 2 │ "Variable"  │ "10.2" │ …   →   items[1]: { planName, rate, term }
row 3 │ "Fixed 24"  │ "12.4" │ …   →   items[2]: { planName, rate, term }
```

Header fields and item fields are defined separately in the schema (`headerFields` / `itemFields`). The result merges header fields and the `items` array into a single object.

#### `extractValue(el, type)` — cell-level type coercion

All three parsers delegate to this function. Given a cell element and a type string, it returns the correctly typed value:

| Type      | What it reads                            | Returns                |
| --------- | ---------------------------------------- | ---------------------- |
| `text`    | `el.textContent`                         | `string \| null`       |
| `html`    | `el.innerHTML`                           | `string \| null`       |
| `number`  | `el.textContent` → `parseFloat`          | `number \| null`       |
| `boolean` | `el.textContent === 'true'`              | `boolean`              |
| `list`    | `<li>` elements, or comma-split fallback | `string[]`             |
| `link`    | First `<a>` href, or text fallback       | `string \| null`       |
| `image`   | First `<img>`                            | `{ src, alt } \| null` |
| `picture` | First `<picture>` (or `<img>` fallback)  | `Element \| null`      |

---

## Preview Server

**`scripts/preview-server/`** — started with `npm run preview` → `http://localhost:5175`

A local Express + Vite server that auto-discovers all blocks and generates interactive previews without needing a real AEM environment.

### How it works

1. **Block discovery**: scans `blocks/` for directories, reads each `_block.json`.
2. **HTML generation** (`html-generator.js`): converts the `eds` schema + mock variant data into the exact HTML EDS would produce in production (double-wrapped cells, proper row structure).
3. **Preview page**: serves that HTML inside a full EDS-style page that loads real styles and scripts, so the block's `decorate()` runs exactly as in production.
4. **Vite middleware**: all JS/CSS is served through Vite, so edits are reflected instantly on browser refresh.
5. **Auto-refresh**: the dashboard polls `/api/blocks` every 3 s and reloads if a new block appears.

### Endpoints

| URL                                            | Description                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `http://localhost:5175/`                       | Dashboard — grid of all blocks                                       |
| `/preview/:blockName`                          | Full preview of a block (native EDS preview page)                    |
| `/preview/:blockName?variant=X`                | Preview a specific variant                                           |
| `/tools/sidekick/library.html`                 | Sidekick Library UI                                                  |
| `/tools/sidekick/library.json`                 | Block list consumed by Sidekick Library                              |
| `/tools/sidekick/blocks/:blockName`            | Container page (used by Sidekick Library renderer)                   |
| `/tools/sidekick/blocks/:blockName.plain.html` | Raw `.plain.html` (sections as direct `<body>` children)             |
| `/api/blocks`                                  | JSON array of all discovered blocks (used by dashboard auto-refresh) |

### Block status badges

| Badge             | Meaning                                 |
| ----------------- | --------------------------------------- |
| `✓ ready`         | Has both `eds` and `mock` sections      |
| `no _block.json`  | No JSON file found in the block folder  |
| `no eds section`  | JSON exists but `"eds"` key is missing  |
| `no mock section` | JSON exists but `"mock"` key is missing |

### Adding a new block to the preview

1. Create the block folder under `blocks/` with `blockname.js` and `blockname.css`.
2. Add a `_blockname.json` with `"eds"` and `"mock"` sections (see [Block JSON format](#the-_blockjson-file)).
3. Refresh `http://localhost:5175` — the block appears automatically.

---

## Sidekick Library

`http://localhost:5175/tools/sidekick/library.html`

A local instance of the [AEM Sidekick Library](https://www.aem.live/tools/sidekick/library/) (`<sidekick-library>` custom element). It shows all blocks in a browsable UI where authors can preview how a block looks and copy the correct table structure into a DA document.

### How it connects to the preview server

```
library.html
  └─ <sidekick-library config.base="/tools/sidekick/library.json">
       └─ GET /tools/sidekick/library.json
            └─ [{ name: "Accordion", path: "/tools/sidekick/blocks/accordion" }, ...]
                 └─ blocks plugin fetches:
                      /tools/sidekick/blocks/accordion.plain.html   ← block list
                      /tools/sidekick/blocks/accordion              ← container page
                           (rendered in an iframe by the plugin)
```

### Configuration (`library.html`)

```js
document.querySelector('sidekick-library').config = {
  base: '/tools/sidekick/library.json',
};
```

`config.base` must point to the `library.json` file, not the server origin.

### `library.json` format

The preview server generates this dynamically from discovered blocks:

```json
{
  "data": [
    { "name": "Accordion", "path": "/tools/sidekick/blocks/accordion" },
    { "name": "Hero", "path": "/tools/sidekick/blocks/hero" }
  ]
}
```

### Known workarounds in `library.html`

Two bugs in the upstream `sidekick-library` component are patched inline:

1. **`CustomEvent.details` polyfill**: the `blocks.js` plugin reads `event.details.path` but `CustomEvent` stores data on `.detail` (no `s`). A property getter aliasing `.details → .detail` is added to `CustomEvent.prototype`.

2. **Double `window.open` deduplication**: `index.js` dispatches a `PreviewBlock` event (which `blocks.js` handles with `window.open`) and then immediately calls `window.open` itself — opening two tabs. A wrapper around `window.open` suppresses any second call to the same URL within 100 ms.

---

## Content Models

The `models/` folder is the **single source of truth** for Universal Editor integration. The three files map directly to what UE expects:

| File                         | Purpose                                                 |
| ---------------------------- | ------------------------------------------------------- |
| `component-definitions.json` | Registers components and their `resourceType` / `:type` |
| `component-filters.json`     | Controls which blocks can be inserted in each container |
| `component-models.json`      | Defines the editable fields for each component in UE    |

**Workflow:**

1. Edit files in `models/`.
2. Run `npm run build:models` to copy them to the project root.
3. Commit both — the root copies are what EDS/UE reads in production.

---

## Storybook

```bash
npm run storybook        # Dev server at http://localhost:6006
npm run build-storybook  # Static build
```

Storybook is used for **React-based blocks only** — the blocks that export a React component tree rather than a plain `decorate()` function (e.g. `plans`, `my-account`). It provides isolated, fast iteration on component UI without needing EDS or a running preview server.

### Story files

Each React block that has stories keeps them in a `blockname.stories.jsx` file next to the component:

```
blocks/plans/
├── plans.js              # EDS entry — decorate() mounts the React tree
├── plans.stories.jsx     # Storybook stories
└── components/
    └── Plans.jsx         # React component imported by both
```

Storybook picks up every `blocks/**/*.stories.jsx` file automatically (configured in `.storybook/main.js`).

### Story format

Stories follow the [Component Story Format (CSF 3)](https://storybook.js.org/docs/api/csf):

```jsx
import Plans from './components/Plans.jsx';
import { mockPlans } from './usePlansData.js';

export default {
  title: 'Blocks/Plans',
  component: Plans,
};

export const Default = {
  args: { plans: mockPlans },
};

export const Loading = {
  render: () => <div className="plans plans--loading">...</div>,
};
```

### Global setup (`.storybook/preview.js`)

All stories automatically get the site's base CSS loaded:

```js
import '../styles/styles.css';
import '../styles/tokens.css';
```

Two background options are available in the Storybook toolbar: `light` (`#ffffff`) and `gray` (`#f5f5f5`).

### Storybook vs Preview Server

|                          | Preview Server                        | Storybook                                 |
| ------------------------ | ------------------------------------- | ----------------------------------------- |
| Block types              | All (JS + React)                      | React blocks only                         |
| Runs EDS `decorate()`    | Yes                                   | No — renders the React component directly |
| Uses real styles/scripts | Yes                                   | Yes (via `preview.js` imports)            |
| Best for                 | Integration preview, Sidekick Library | Component isolation, design iteration     |
| Port                     | 5175                                  | 6006                                      |

> Story files are excluded from Vitest runs (`vitest.config.js`).

---

## Testing

```bash
npm test           # Run all unit tests once (Vitest)
npm run test:watch # Watch mode
npm run test:e2e   # Playwright end-to-end tests
```

Unit tests live in `tests/` and in `__tests__/` folders next to the files they cover. Vitest is configured in `vitest.config.js` and uses jsdom as the test environment.
