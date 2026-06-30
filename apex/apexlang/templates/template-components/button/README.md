# Button Templates

## Purpose
Canonical Button helper pack for the Theme 42 `button` template component, using Markdown-first scenario templates.

## Usage
- Load `button._index.md` first.
- Load `button._common.md` next to align variable contracts, guardrails, and required inputs.
- Load `button._template_options.md` when the request changes helper-button attributes.
- Load one scenario variant matching the requested helper behavior.
- For helper buttons with `iconClasses` plus visible label text, put `t-Button--iconLeft` in `cssClasses` by default; use `t-Button--iconRight` only by explicit request, and omit both when `isIconOnly: true`.

## Template Catalog
- `button._common.md`
- `button._index.md`
- `button._template_options.md`
- `button.navigation.md`
- `button.hot-icon.md`
- `button.menu-trigger.md`

## Maintenance
- Keep this README synchronized with actual files in this directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep family guidance aligned with page-level standards in memory-bank rules and with scenario coverage in this folder.
