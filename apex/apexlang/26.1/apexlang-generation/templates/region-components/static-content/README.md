# Static Content Templates

## Purpose
Canonical guidance for the `static-content` region family, including shared contract loading and supported scenario variants.

## Usage
- Load `static-content._index.md` first.
- Load `static-content._common.md` next to align variable contracts, guardrails, and required inputs.
- Load `static-content._template_options.md` when the request changes region `appearance.templateOptions`.
- Load `static-content._nested-region._common.md` for reusable child region contracts.
- Load `static-content._button._common.md` when scenarios include inline button actions.
- Load one scenario variant matching the requested interaction pattern and page composition context.

## Template Catalog
- `static-content._index.md`
- `static-content._common.md`
- `static-content._template_options.md`
- `static-content._nested-region._common.md`
- `static-content._button._common.md`
- `static-content.accordion.md`
- `static-content.blank-with-attributes.md`
- `static-content.buttons.md`
- `static-content.cards.md`
- `static-content.collapsible.md`
- `static-content.collection-toolbar.md`
- `static-content.dividers.md`
- `static-content.empty-state.md`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep family guidance aligned with page-level standards in memory-bank rules and with scenario coverage in this folder.
