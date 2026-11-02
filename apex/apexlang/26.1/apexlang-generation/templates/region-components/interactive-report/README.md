# Interactive Report Templates

## Purpose
Canonical guidance for the `interactive-report` region family, including shared contract loading and supported scenario variants.

## Usage
- Load `interactive-report._index.md` first.
- Load `interactive-report._common.md` next to align variable contracts, guardrails, and required inputs.
- Load `interactive-report._template_options.md` when the request changes region `appearance.templateOptions`.
- Load `interactive-report._columns._common.md` for the canonical column contract used by all interactive-report variants.
- Load one scenario variant matching the requested interaction pattern and data source type.
- Load `interactive-report._columns.format-template.md` only when column formatting guidance is needed.

## Template Catalog
- `interactive-report._index.md`
- `interactive-report._common.md`
- `interactive-report._template_options.md`
- `interactive-report._columns._common.md`
- `interactive-report._columns.format-template.md`
- `interactive-report.nl2ir.md`
- `interactive-report.page-header-actions.md`
- `interactive-report.rest-data-source-parameter.md`
- `interactive-report.rest-data-source.md`
- `interactive-report.secondary.md`
- `interactive-report.standard.md`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep family guidance aligned with page-level standards in memory-bank rules and with scenario coverage in this folder.
