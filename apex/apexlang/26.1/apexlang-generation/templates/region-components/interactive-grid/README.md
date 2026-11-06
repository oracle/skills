# Interactive Grid Templates

## Purpose
Canonical guidance for the `interactive-grid` region family, including shared contract loading and supported scenario variants.

## Usage
- Load `interactive-grid._index.md` first.
- Load `interactive-grid._common.md` next to align variable contracts, guardrails, and required inputs.
- Load `interactive-grid._columns._common.md` for canonical grid column contract blocks.
- Load `interactive-grid._saved-report._common.md` for shared saved report contract blocks.
- Load one scenario variant matching the requested interaction pattern and data source type.
- Every Interactive Grid must include at least one saved report. Load the saved-report and columns partials so the generated region emits a baseline `savedReport PRIMARY` plus explicit `displayColumn` coverage for the grid and single-row view.
- Treat saved-report refreshes as metadata-only unless packaged metadata proves broader Interactive Grid DSL drift:
  - aggregate import metadata now flows through the `create_ig_rpt_agg_apexlang` path
  - aggregate metadata keeps view/static-id parameters structurally visible when the accepted contract exposes them
  - chart `Sort By` defaults to `LABEL`, so explicit non-default values exclude `LABEL`
- Use the optional `componentAdvanced.initJavaScriptFunction` block only when JavaScript initialization is required; keep it wrapped in ` ```javascript-browser ` and return `options`.
- Preserve canonical path references and markdown-first conventions when updating workflow or registry links.

## Template Catalog
- `interactive-grid._index.md`
- `interactive-grid._common.md`
- `interactive-grid._columns._common.md`
- `interactive-grid._saved-report._common.md`
- `interactive-grid.standard.md`
- `interactive-grid.region.md`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep family guidance aligned with page-level standards in memory-bank rules and with scenario coverage in this folder.
