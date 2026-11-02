# Shared Components Templates

## Purpose
Catalog of shared-component template families used for app-level configuration and reusable metadata artifacts.

## Usage
- Load the primary markdown contract/index in this directory before selecting scenario details.
- The matching skill-package entrypoint is `references/domains/README.md`; keep both docs aligned when family coverage or loading rules change.
- Use these templates when generating app-level reusable components and keep aliases/names synchronized with page references.
- Preserve canonical path references and markdown-first conventions when updating workflow or registry links.
- Use `shared-components.registry.json` when tooling needs a machine-readable catalog for this family.
- Compatibility notes:
  - Shared navigation entries (lists and breadcrumbs) use `link { target: ... }`.
  - `behavior { ... }` is valid in page/button contexts, but not for shared list/breadcrumb entries.
  - `componentSetting` uses `settings { attributes: {...} }` for current compiler compatibility.

## Structure
- This directory contains shared-component templates grouped by family (authentications, authorizations, lists, LOVs, etc.).
- AI configuration contract: `ai-configuration.md` (shared AI agent/chatbot asset; generated assistant files live under `/shared-components/ai-agents/`).
- For new applications, seed baseline shared components from `templates/base-app-structure/scaffold-example/shared-components/`.

## Template Catalog
- `acl-roles/`
- `app-processes/`
- `authentications/`
- `authorizations/`
- `breadcrumbs/`
- `component-settings/`
- `email-templates/`
- `lists/`
- `lovs/`
- `rest-data-sources/`
- `task-definitions/`
- `translations/`
- `app-computations.md`
- `app-items.md`
- `build-options.md`
- `component-settings.example.md`
- `email-templates.example.md`
- `shared-components.registry.json`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep shared-component references consistent with generated application structure and page-level dependencies.
- Keep `shared-components.registry.json` aligned with folder entrypoints and standalone artifacts.
