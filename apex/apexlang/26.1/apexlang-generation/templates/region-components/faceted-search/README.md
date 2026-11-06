# Faceted Search Templates

## Purpose
Canonical guidance for the `faceted-search` region family, including shared contract loading and supported scenario variants.

## Usage
- Load `faceted-search._common.md` first to align variable contracts, guardrails, and required inputs.
- Choose a scenario variant matching the requested interaction pattern, data source type, and page composition context.
- For emitted child metadata, use `facet (...)` blocks in this family. Do not guess between `facet` and `filter`; follow the canonical example and shared contract here.
- Prefer the canonical emitted facet type values shown in this family and the page example: `search`, `checkboxGroup`, `radioGroup`, `selectList`, and `range`.
- Keep facet source data types runtime-safe: date/time facets use `dataType: date`, numeric facets use `dataType: number`, and string facets omit `source.dataType` instead of emitting SQL/report tokens such as `varchar2` or `VARCHAR2`.
- For checkbox/radio facets, cap visible values with `listEntries.maxDisplayedEntries: 10`; for likely high-cardinality value lists, also set `listEntries.displayFilterInitially: true`.
- Preserve canonical path references and markdown-first conventions when updating workflow or registry links.

## Template Catalog
- `faceted-search._common.md`
- `faceted-search.standard.md`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep family guidance aligned with page-level standards in memory-bank rules and with scenario coverage in this folder.
