# Validations Templates

## Purpose
Canonical validation documentation covering expression, SQL, item, interactive-grid, function-body, and PL/SQL error patterns.

## Usage
- Load `validations._common.md` first to align variable contracts, guardrails, and required inputs.
- Prefer declarative validation patterns before function-body/error paths, and keep condition usage consistent with logic rules.
- Use `validations.item.md` for declarative page-item and interactive-grid column checks.
- Preserve canonical path references and markdown-first conventions when updating workflow or registry links.

## Template Catalog
- `validations._common.md`
- `validations._index.md`
- `validations.expression.md`
- `validations.function-body.md`
- `validations.item.md`
- `validations.plsql-error.md`
- `validations.sql.md`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep validation guidance synchronized with canonical validation type catalog, interactive-grid support, and logic guardrails.
