# List Templates

## Purpose
Catalog of canonical list region templates for the `list` region family, including shared contract loading and supported qualifier variants.

## Usage
- Load `list._index.md` first as the routing entrypoint.
- Load `list._common.md` to align variable contracts, guardrails, and required inputs.
- Choose a qualifier file matching the intended list template appearance (`cards` or `mediaList`).
- For `mediaList`, align report-level attribute names and values with `../../template-components/media-list/media-list._template_options.md`, plus `../../template-components/avatar/avatar._template_options.md` and `../../template-components/badge/badge._template_options.md` for shared substructures.
- Preserve canonical path references and markdown-first conventions when updating workflow or registry links.

## Template Catalog
- `list._index.md`
- `list._common.md`
- `list.media-list.md`
- `list.cards.md`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep family guidance aligned with page-level standards in memory-bank rules and with qualifier coverage in this folder.
