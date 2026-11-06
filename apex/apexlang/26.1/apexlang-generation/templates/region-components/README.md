# Region Components Templates

## Purpose
Catalog of canonical markdown-first region template families and their routing entrypoints.

## Usage
- Load the primary markdown contract/index in this directory before selecting scenario details.
- Choose a scenario variant matching the requested interaction pattern, data source type, and page composition context.
- Resolve allowed region `templateOptions` values from the owning family-local `*_template_options.md` file; pass the documented `static_id`, not the emitted CSS class string.
- Preserve canonical path references and markdown-first conventions when updating workflow or registry links.
- Use `region-components.registry.json` when tooling needs a machine-readable catalog for this family.

## Template Catalog
- `breadcrumb/`
- `calendar/`
- `cards/`
- `chart/`
- `classic-report/`
- `collapsible-region/`
- `dynamic-content/`
- `faceted-search/`
- `form/`
- `help-text/`
- `interactive-grid/`
- `interactive-report/`
- `list/`
- `map/`
- `region-display-selector/`
- `search-config/`
- `smart-filter-search/`
- `static-content/`
- `region-components.registry.json`
- `LEGACY.md`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep family guidance aligned with page-level standards in memory-bank rules and with scenario coverage in this folder.

## Template Option Ownership

Use the listed owner file for the canonical `static_id` inventory of each Theme 42 region template.

- `breadcrumb/breadcrumb._template_options.md`
  - Owns `title-bar`
- `cards/cards._template_options.md`
  - Owns `cards-container`
- `collapsible-region/collapsible-region._template_options.md`
  - Owns `collapsible`
- `form/form._template_options.md`
  - Owns `buttons-container` and `item-container`
- `interactive-report/interactive-report._template_options.md`
  - Owns `interactive-report`
- `static-content/static-content._template_options.md`
  - Owns `alert`, `blank-with-attributes`, `blank-with-attributes-no-grid`, `carousel-container`, `content-block`, `hero`, `image`, `inline-dialog`, `inline-drawer`, `inline-popup`, `login`, `search-results-container`, `standard`, `tabs-container`, and `wizard-container`
