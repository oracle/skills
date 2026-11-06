# Content Row Templates

## Purpose
Canonical Content Row template pack for `themeTemplateComponent/contentRow`, using Markdown-first scenario templates.

## Usage
- Load `content-row._common.md` first for variable contract and generation guardrails.
- Use `content-row._index.md` to pick the correct scenario template.
- Load `content-row._template_options.md` for Content Row-specific settings, appearance, and grouping values.
- Load `../avatar/avatar._template_options.md` and `../badge/badge._template_options.md` for the shared avatar and badge substructures.
- Avatar-capable Content Row scenarios use `settings.displayAvatar` plus `plugin-avatar` fields for type, initials/description, shape, size, and CSS classes.
- Badge-capable Content Row scenarios use `settings.displayBadge` plus `plugin-badge` fields for label, value, state, style, shape, size, icon, position, and width.
- SQL-backed template component regions must emit top-level `orderBy {}` and must not embed `ORDER BY` inside `source.sqlQuery`.
- When Content Row grouping is used on child columns, the top-level `orderBy` must sort by all grouped columns first before any remaining tie-breakers.
- Report-mode Content Row requires explicit child `column (...)` metadata.
- By default, those child columns should match the delivered region source projection in order, not just the minimum subset needed to satisfy the compiler.
- When Content Row uses any `rowSelection` mode, one child column must carry `source.primaryKey: true`.

## Template Catalog
- `content-row._common.md`
- `content-row._index.md`
- `content-row._template_options.md`
- `content-row.partial-minimal.md`
- `content-row.partial-rich-content.md`
- `content-row.report-minimal.md`
- `content-row.report-explicit-defaults.md`
- `content-row.report-avatar-badge.md`
- `content-row.report-link-positions.md`
- `content-row.report-primary-actions-menu.md`
- `content-row.report-grouping-selection.md`
- `content-row.report-appearance-variants.md`

## Maintenance
- Keep this README synchronized with actual files in this directory.
- Keep `manifest.json` in sync with scenario files and feature tags.
- New or updated scenario docs should include: `# Purpose`, `# Output Template`, `# Conditional Rendering Rules`, `# Validation Checklist`.
