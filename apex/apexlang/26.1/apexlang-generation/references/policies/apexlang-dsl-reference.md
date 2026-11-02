# APEXlang DSL Reference (Codex & AI tooling)

## Overview
- **Purpose:** Provide a concise reference for composing APEXlang artifacts that both Codex and AI tooling can consume.
- **Scope:** Pages, regions, items, shared components, validations, and shared templates located under `templates/**`.
- **Usage:** Load the minimal rule set from `references/policies/memory-bank/` and reference these templates for deterministic outputs.


## When to Use This Guide
- Reference for onboarding teammates needing plain-language context before diving into templates.
- Helpful during reviews when verifying generated DSL matches template expectations.
- Not required for automated agents; they rely on templates and memory-bank rules directly.

## DSL Conventions
- Key-value pairs use `name: value` with colon syntax.
- Multi-line text (SQL, PL/SQL) lives inside triple backticks with language hints (` ```sql `, ` ```plsql `).
- Template identifiers follow PascalCase and align with Universal Theme (UT) components.
- Never invent attributes; reuse those documented in templates and rule files.

## Packaged Build Baseline
- The active packaged baseline for this repo does not introduce broad APEXlang name-set drift.
- Treat packaged-build refreshes as narrow metadata deltas unless packaged metadata proves broader DSL drift.

## Core Categories

### Pages (`templates/page-examples/`)
- Each page family is foldered as:
  - `<page-name>/<page-name>._index.md`
  - `<page-name>/<page-name>._common.md`
  - `<page-name>/page.apx`
- Core page families include:
  - `global_page_0/`
  - `home-page/`
  - `login-page/`
  - `form-page/`
  - `interactive-report-page/`
  - `interactive-grid/`
  - `dashboard-page/`
  - `faceted-search/`, `map-page/`, `calendar-page/`

### Page Layout Templates (`templates/page-layout-templates/`)
- Provide UT layout scaffolds: `standard.apx`, `modal-dialog.apx`, `drawer.apx`, etc.
- Use via `appearance { pageTemplate: @/standard }` or matching identifier.

### Region Components (`templates/region-components/`)
- `static-content/static-content._common.md` — Shared contract for static content regions.
- `static-content/static-content.accordion.md` — Accordion region scenarios.
- `static-content/static-content.collapsible.md` — Collapsible region scenarios.
- `static-content/static-content.blank-with-attributes.md` — Blank container layouts.
- `static-content/static-content.cards.md` — Cards and smart filter integration.
- `static-content/static-content.collection-toolbar.md` — Collection toolbar with smart filters.
- `static-content/static-content.dividers.md` — Divider region examples.
- `static-content/static-content.empty-state.md` — Empty state templates.
- `static-content/static-content.buttons.md` — Toolbar and body button patterns.
- `region-components/classic-report/`, `region-components/interactive-report/`, and `region-components/interactive-grid/` — Tabular region families with `_index.md`, `_common.md`, and scenario docs.
- Chart templates now live under `templates/region-components/chart/` and use `chart._common.md` plus scenario-specific Markdown files.
- `dynamic-content.apx`, `dynamic-action-refresh-report.apx` — Programmatic and dynamic behaviors.
- Breadcrumb and template component patterns included for consistent navigation.

### Interactive Grid Saved-Report Notes
- Interactive Grid saved-report aggregate metadata now maps through `wwv_flow_imp_page.create_ig_rpt_agg_apexlang`.
- Interactive Grid saved-report aggregate metadata now keeps `p_view_id` and `p_static_id` structurally visible in the import path.
- Interactive Grid saved-report chart `Sort By` now defaults to `LABEL`.
- When documenting or generating explicit non-default chart sort values, use only `VALUE`, `HIGH`, `LOW`, `TARGET`, `X`, `Y`, and `Z`.
- Do not emit explicit `LABEL` just to restate the default behavior unless the DSL contract for the concrete template requires it.

### Items (`templates/items/`)
- Items are foldered by family, for example:
  - `items/text-field/text-field._index.md`
  - `items/select-list/select-list._index.md`
  - `items/radio-group/radio-group._index.md`
  - `items/switch/switch._index.md`
  - `items/number-field/number-field._index.md`
- For LOV-backed items, start from the relevant family `_index.md` and pair with shared LOV templates when needed.

### Buttons (`templates/buttons/`)
- Use `buttons._index.md` as dispatcher and `buttons._common.md` for shared contract/guardrails.
- Load one action-specific variant template (`buttons.submit.md`, `buttons.redirect-this-app.md`, `buttons.redirect-other-app.md`, `buttons.defined-by-da.md`, `buttons.trigger-action.md`, `buttons.menu.md`) plus optional overlays as needed.

### Shared Components (`templates/shared-components/`)
- Shared components are organized by family folders such as `lovs/`, `lists/`, `component-settings/`, `authorizations/`, `authentications/`, and `breadcrumbs/`.
- Base app structure templates under `base-app-structure/scaffold-example/` provide the runtime seed for critical shared components and baseline pages. They do not authorize whole-directory publish into generated app roots.

### Validations (`templates/business-logic/validations/validations._index.md`)
- Variable catalog: `templates/business-logic/validations/validations._common.md`.
- Documents and captures every validation type for APEX, including button-gated and authorization-aware patterns.
- Before generating any validation, start from the gospel skeleton:
    ````
    validation [validationStaticId] (
        name: [validationName]
        execution {
            sequence: [seq]
        }
        validation {
            plsqlExpression: [plsqlExpression]
        }
        error {
            errorMessage: [errorMessage]
            associatedItem: [associatedItem]
        }
        security {
            authorizationScheme: [authorizationScheme]
        }
    )
    ````
  - Replace placeholders with real values; drop the entire `security {}` block if no authorization scheme is required.
- Replace button aliases (for example `@{submit-button}`) and authorization schemes with page-specific components before use.

## Governance References
- `references/policies/memory-bank/00-guard/ai.guard.md` — Non-negotiable guardrails.
- `references/policies/memory-bank/10-global/apex.global.md` — Global naming, navigation, and access standards.
- `references/policies/memory-bank/20-data/*` — SQL and logic policies (invoke API first, named notation).
- `references/policies/memory-bank/30-pages/*` — Page-type rules (forms, reports, dashboards, charts).
- `references/policies/memory-bank/40-components/*` — Component-specific guidance plus the shared composition contract for templates, template options, and grid/layout defaults.

## Template Documentation Strategy
- Each template includes inline comments describing purpose, variants, and usage notes.
- Official documentation should reference these templates directly; avoid duplicating definitions elsewhere.
- For Codex automation, pair template paths with metadata (component name, required inputs) in manifests.

## Best Practices for Codex & AI tooling Execution
- **Minimal Rule Loading:** Use `assets/rules-mapping.json` to resolve required rules per artifact.
- **Critical Pages:** Ensure `p00000-*.apx`, `p00001-*.apx`, and `p09999-*.apx` exist or are generated from the base app structure templates.
- **Shared Components:** Seed only the named runtime artifacts when creating new applications (see templates under `base-app-structure/scaffold-example`), and keep template-family docs and registries out of generated app roots.
- **Logging:** Final published output goes to `applications/<target-app>/...` only after the resolved live runtime action succeeds. Durable runtime evidence is limited to compact reports and transcripts under `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/``, created only when a workflow writes them.
- **Confidence Scores:** The internal review loop must retain a numeric confidence threshold of at least `0.95` before publish/completion wording.

## Integration Hooks
- Components registry (`assets/apex-generation/components.registry.json`) links natural language synonyms to templates and rules.
- Orchestration router (`SKILL.md`) provides the app-development entrypoint, delegating full generation by loading `references/workflows/apex-generation.md`.
- `assets/orchestration.manifest.json` exposes machine-readable orchestration metadata.

## Next Steps
- Maintain this reference alongside template updates.
- Expand with component-specific sections (e.g., items, regions) including required inputs tables and example snippet references.
- Align Codex skill documentation with this guide to prevent divergence.
