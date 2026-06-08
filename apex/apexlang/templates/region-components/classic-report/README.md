# Classic Report Templates

## Purpose
Canonical guidance for the `classic-report` region family, including shared contract loading and supported scenario variants.

## Usage
- Load `classic-report._common.md` first to align variable contracts, guardrails, and required inputs.
- Load `classic-report._columns._common.md` for the canonical column contract used by all classic-report variants.
- Use `classic-report._columns.format-template.md` for formatting rules and reference examples when choosing column masks/alignment.
- Classic Report regions must emit both `appearance { template: @/standard ... }` for the region wrapper and `componentAppearance { template: @/standard ... }` for the report component template unless a scenario documents a wrapper override.
- Contextual Info Classic Reports use `appearance.template: @/contextual-info` with `templateOptions` exactly `#DEFAULT#`, `t-Region--hideHeader js-addHiddenHeadingRoleDesc`, and `t-Region--noUI`.
- Default Classic Report component template options are `#DEFAULT#`, `t-Report--stretch`, and `t-Report--horizontalBorders`. Do not emit alternating-row tokens (`t-Report--altRowsDefault` or `t-Report--staticRowColors`) or row highlight by default.
- Choose a scenario variant matching the requested interaction pattern, data source type, and page composition context.
- Preserve canonical path references and markdown-first conventions when updating workflow or registry links.

## Template Catalog
- `classic-report._common.md`
- `classic-report._columns._common.md`
- `classic-report._columns.format-template.md`
- `classic-report.ao-notifications.md`
- `classic-report.context-info-column-based.md`
- `classic-report.contextual-info-row-based.md`
- `classic-report.percent-graph-columns.md`
- `classic-report.rest-data-source-and-query-param.md`
- `classic-report.rest-data-source.md`
- `classic-report.standard.md`
- `classic-report.suggestions-simple-list.md`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep family guidance aligned with page-level standards in memory-bank rules and with scenario coverage in this folder.
