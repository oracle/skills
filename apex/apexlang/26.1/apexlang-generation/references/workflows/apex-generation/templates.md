> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.

# Template & Sub-Skill References — APEX Developer

## Authoritative Policies
- `references/policies/governance/00-governance.md`
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `assets/rules-mapping.json`
- `references/policies/memory-bank/systemPatterns.md`
- `references/policies/memory-bank/10-global/apex.global.md`
- `references/policies/memory-bank/40-components/apex.templates.md`

## Operational References


## Canonical Page Templates
- `templates/page-examples/global_page_0/global_page_0._index.md`
- `templates/page-examples/home-page/home-page._index.md`
- `templates/page-examples/login-page/login-page._index.md`
- `templates/page-examples/blank-page/blank-page._index.md`
- `templates/page-examples/interactive-report-page/interactive-report-page._index.md`
- `templates/page-examples/form-page/form-page._index.md`
- `templates/page-examples/dashboard-page/dashboard-page._index.md`
- `templates/page-examples/classic-report-page/classic-report-page._index.md`
- `templates/page-examples/calendar-page/calendar-page._index.md`
- `templates/page-examples/map-page/map-page._index.md`

Calendar note:
- Keep calendar examples aligned with compiler-truth-backed runtime guidance and the local validator behind `node tools/apexctl.mjs apexlang validate --app-path <resolved_app_path>`; use `assets/component-attributes.json` only as fallback/internal validator context when stronger runtime-backed proof is unavailable.
- Calendar `createLink` and `viewEditLink` examples should use structured object syntax with required `page` and optional `items`, and should never invent target pages or target item mappings when the user did not provide them.

## Delegate to Sub-Skills
- **Page Patterns** — `references/domains/page-components/page-patterns.md`
  - Navigation, breadcrumbs, page groups; see `references/domains/page-components/page-patterns/templates.md`.
- **Regions** — `references/domains/page-components/regions.md`
  - Interactive Reports (IRs), Interactive Grids (IGs), faceted search, dashboards, charts, classic reports, form, etc.; templates listed in `references/domains/page-components/regions/templates.md`.
- **Template Components** — `references/domains/README.md`
  - Layout slots, template options, button archetypes.
- **Page Items** — `references/domains/page-components/page-items.md`
  - Item types, LOVs, validations, computations.
- **Shared Components** — `references/domains/README.md`
  - Navigation lists, breadcrumbs, shared LOVs, translations.

## Guardrails & Loading
- Always load `references/policies/memory-bank/00-guard/ai.guard.md` and `references/policies/memory-bank/10-global/apex.global.md`.
- Use `assets/rules-mapping.json` to fetch additional rules per component keyword.
- Treat default help text, report-column guidance, and developer comments as baseline generation concerns; load the matching form/report rule files even when the prompt does not explicitly ask for annotations.
- Treat `simple`, `basic`, `starter`, or similar prompt wording as a request for concise output, not as permission to skip the default guidance layer.
- Skill-local agents live in `references/workflows/apex-generation/agents/*.md` (Draft, Critique, Revision).
