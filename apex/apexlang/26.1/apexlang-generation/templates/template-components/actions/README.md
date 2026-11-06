# Actions Templates

## Purpose
Canonical Actions template component pack for the Theme 42 `actions` helper, using MD-first scenario templates with one canonical APX fragment.

## Usage
- Load `actions._index.md` first.
- Load `actions._common.md` next to align variable contracts, guardrails, and required inputs.
- Load `actions._template_options.md` when the request changes helper settings such as `gap`, `size`, or `wrapActions`.
- Load one scenario variant matching the requested helper pattern.

## Template Catalog
- `actions._common.md`
- `actions._index.md`
- `actions._template_options.md`
- `actions.inline-button.md`
- `actions.menu-trigger.md`
- `actions.nested-group.md`

## Maintenance
- Keep this README synchronized with actual files in this directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep family guidance aligned with page-level standards in memory-bank rules and with scenario coverage in this folder.
