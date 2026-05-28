# Config Page Loader

## What it is

The Config Page Loader is a small utility that turns a normal EDS page into a typed configuration object for React or JavaScript blocks. Instead of relying on a spreadsheet or a JSON API, authors create a regular content page and write simple paragraphs in the format `Key: Value`.

When the page is published, the component reads the corresponding `.plain.html` endpoint, parses every paragraph that contains a key/value pair, normalizes each key to camelCase, and returns a flat JavaScript object. The result is easy for components to consume and easy for authors to edit using familiar EDS authoring flows.

## Why a page instead of a spreadsheet

A config page fits the EDS authoring model better than a spreadsheet because the author can create, edit, review, publish, and preview it with the same workflow used for the rest of the site. The content lives in the same system, follows the same publishing rules, and can be versioned and reviewed the same way as any other page.

A spreadsheet is useful for dense tabular data, but it introduces an extra content source, a different editing workflow, and more translation logic on the component side. A config page keeps the configuration close to the site itself and works especially well when the settings are mostly descriptive text, links, booleans, and numeric values.

## How the author creates a config page

1. Create a normal EDS page, for example `/config/enrollment`.
2. Add optional section headings like `## general`, `## steps`, or `## redirects` to keep the content organized.
3. Under each section, write one setting per paragraph using the format `Key: Value`.
4. Publish the page like any other EDS content page.
5. Point the component to the page path without the extension, for example `/config/enrollment`.

Example author content:

```text
## general
Title: Enroll in Ohio Natural Gas
Subtitle: Takes only 5 minutes
Support Phone: 1-800-555-0100
Terms Required: true
Min Age: 18

## redirects
Success URL: /enrollment/confirmation
Error URL: /enrollment/error
```

## Naming conventions

| In the document | In the JS object |
| --------------- | ---------------- |
| Title           | title            |
| Support Phone   | supportPhone     |
| Step 1 Title    | step1Title       |
| Terms URL       | termsUrl         |

Keys are normalized to camelCase. Spaces and separators are removed, and numbers are preserved, so `Step 1 Title` becomes `step1Title`.

## Supported value types

The loader casts each value to the most likely native type:

- `true` and `false` become booleans.
- Numeric strings like `18` or `3.5` become numbers.
- Everything else remains a trimmed string.

That means authors can write natural values in the document and the component receives useful native types without manual parsing in the block code.

## How to add a new component with a config page

1. Create a config page in EDS with `Key: Value` paragraphs.
2. Add a block field such as `configPath` that points to the page path without `.plain.html`.
3. In the block hook or data layer, call `loadConfigPage(configPath)`.
4. Use the returned object as component props or internal config.
5. Add a local fixture in `tests/local/assets/config/` so the preview server can simulate the published config page.
6. Add unit tests for both the parser and the consuming component.

## Local testing

For local testing, the preview server can serve static fixtures from `tests/local/assets/config/`. A request to `/config/enrollment.plain.html` maps to `tests/local/assets/config/enrollment.html`, which simulates the published EDS `.plain.html` output.

If you want the component to skip network loading entirely, open the preview with `?mock=true`. In that mode, the hook returns the internal mock config from the block JSON. You can also use `?mock=true&error=true` to simulate a failing config load path without changing the fixture.
