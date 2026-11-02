# Template & Rule References — Shared Components

## Purpose
- Canonical bridge from the shared-components skill package to the actual template families under `templates/shared-components/`.
- Use this file when the package has already been selected and the next step is deciding which shared-component family to load.

## Authoritative Policies
- `references/policies/governance/00-governance.md`
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/memory-bank/10-global/apex.global.md`
- `references/policies/memory-bank/20-data/apex.logic.md`
- `references/policies/memory-bank/20-data/apex.sql.md`
- `references/policies/memory-bank/40-components/apex.items.md`
- `assets/rules-mapping.json`

## Canonical Template Sources
- Catalog entrypoint: `templates/shared-components/README.md`
- Machine-readable catalog: `templates/shared-components/shared-components.registry.json`
- New-app shared-component seed source: `templates/base-app-structure/scaffold-example/shared-components/**`
- The rest of `base-app-structure/` remains template input only. Do not publish template-family docs or registries into generated app roots.

## Family Map
- Navigation metadata:
  - `templates/shared-components/lists/*.md`
  - `templates/shared-components/breadcrumbs/*.md`
- Shared LOV metadata:
  - `templates/shared-components/lovs/*.md`
  - Pair with `references/policies/memory-bank/40-components/apex.items.md` for LOV consumption rules.
- Shared security metadata:
  - `templates/shared-components/authorizations/*.md`
  - `templates/shared-components/acl-roles/*.md`
  - `templates/shared-components/authentications/*.md`
- App-level configuration metadata:
  - `templates/shared-components/app-processes/*.md`
  - `templates/shared-components/app-computations.md`
  - `templates/shared-components/app-items.md`
  - `templates/shared-components/build-options.md`
  - `templates/shared-components/component-settings/*.md`
- Reusable communication and workflow assets:
  - `templates/shared-components/translations/*.md`
  - `templates/shared-components/email-templates/*.md`
  - `templates/shared-components/task-definitions/*.md`
- Integration and assistant assets:
  - `templates/shared-components/rest-data-sources/*.md`
  - `templates/shared-components/ai-agents/*.md`

## Workflow Add-ons
- `references/domains/universal-attr-config/workflow-page-sequencing.md` for navigation and breadcrumb append operations.
- `references/domains/universal-attr-config/workflow-server-side-conditions-batch.md` when SSC tokens must be applied across shared components.
- `references/domains/shared-components/workflow-translations.md` for single translation/localization runs.
- `references/domains/shared-components/workflow-translations-batch.md` for batch translation/localization runs.
- `references/domains/shared-components/reusable-prompts/translations.md` for human-readable translation prompt scaffolds.

## Loading Contract
- Start with `templates/shared-components/README.md` unless the prompt already names a specific family.
- Open the narrowest family files needed for the request; do not load unrelated shared-component families.
- For translations, keep the family templates and the workflow docs in sync; the workflow docs define process, while the template family defines artifact shape.
- Use `assets/rules-mapping.json` to load policy files only when the request needs them.
