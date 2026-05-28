# tools/preview-server

Local block preview server for EDS development.

## Start

```bash
npm run preview          # starts on http://localhost:5175
```

## Dashboard

Open [http://localhost:5175](http://localhost:5175) to see the block dashboard:

- Lists all blocks with available mock variants
- **Search bar** — filter blocks by name (`⌘K` to focus)
- **Stats bar** — total blocks, React blocks, test counts
- **Tests badge** per block — green/red based on Vitest results
- **Storybook link** per block when a `.stories.jsx` file exists
- Each variant is a direct link to the rendered preview page

## Block preview

```
http://localhost:5175/blocks/<block-name>?variant=<variant>&mock=true
```

## Source of truth: `_block.json`

Each block declares its mock data and EDS schema in `blocks/<name>/_<name>.json`:

```json
{
  "definitions": [ ... ],   // Universal Editor block definitions
  "models":      [ ... ],   // Universal Editor field models
  "filters":     [ ... ],   // Universal Editor filter definitions
  "eds":         { ... },   // EDS table-to-DOM mapping (tooling only)
  "mock":        [ ... ]    // Local preview mock variants (tooling only)
}
```

`definitions`, `models`, and `filters` are assembled by `npm run build:models` into the root `component-*.json` files expected by Universal Editor.

## Config page fixtures

Served from `tests/fixtures/config/`. Add `.html` files here for blocks that load
a `configPath` via EDS config page convention (`.plain.html` responses).

Example:

```
tests/fixtures/config/
  enrollment.html    → served at /config/enrollment.plain.html
```

## Vite middleware

The server runs Vite in middleware mode with the `resolveBundleToJsx` plugin, which maps `.bundle.js` imports to their source `.jsx` files for hot module replacement in development.

## Structure

```
tools/preview-server/
  index.js            Main server (Express + Vite middleware)
  html-generator.js   Builds block HTML from mock data
  __tests__/
    html-generator.test.js
```
