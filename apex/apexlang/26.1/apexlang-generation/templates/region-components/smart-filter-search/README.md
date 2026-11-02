# Smart Filter Search Templates

## Purpose
Canonical guidance for the `smart-filter-search` region family, including shared contract loading and supported scenario variants.

## Usage
- Select the `smart-filter-search` construction pack before loading Markdown.
- Load `smart-filter-search._common.md` to freeze the base-region, search-behavior, settings, security, and performance contracts.
- Use `smart-filter-search.standard.md` only when its single-base-region and required search-child shape matches the request.
- Preserve canonical path references and markdown-first conventions when updating workflow or registry links.
- Use structured JSON for Generation Plan evidence; templates are not evidence.

## Template Catalog
- `smart-filter-search._common.md`
- `smart-filter-search.standard.md`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep family guidance aligned with page-level standards in memory-bank rules and with scenario coverage in this folder.
- Keep ticket settings out of APEXlang output until property-level compiler evidence proves them for the target build.
- Keep artifact rules, plan evidence, and runtime acceptance as separate layers.
