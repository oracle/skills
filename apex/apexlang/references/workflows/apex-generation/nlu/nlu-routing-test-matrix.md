# NLU Routing — Test Matrix (Inputs → Expected Routing and Outputs)

## Purpose
- Verify the NLU Router behavior defined by `SKILL.md` while loading `references/workflows/apex-generation.md`, using the Component Registry (`assets/apex-generation/components.registry.json`) and rule loading via `assets/rules-mapping.json`.
- Each test lists expected: target_type, matched components, rules, templates, required inputs to ask for, and outputs.

## Conventions
- Message 1: references/workflows/apex-generation.md
- Message 2: Auto-computed by the NLU Router or supplied manually.
- Inputs containing `{{...}}` are `illustrative_prompt` grammar examples. Substitute verified identifiers for the variables during a real run; do not treat the variables as schema evidence.
- Outputs:
  - Working copy: transient temp workspace outside the repo
  - Durable runtime evidence: compact report + transcript under `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/`` when needed
  - Final: applications/{target_app}/pages/... or shared-components/... (page/component scope)

## Legend
- Rules are union-loaded: 00-guard + 10-global + matched 20-data/30-pages/40-components.
- Only templates present under templates/* may be used.

1) Page with Interactive Report + Form (same page) + LOV + Refresh
- Input: “Build a page with an interactive report and a form on {{source.table}}; use Lookup LOV for {{lookup.valueColumn}}; refresh report after submit”
- target_type: page
- Components: [interactive-report, form, lov-shared, dynamic-action-refresh-report]
- Rules:
  - 00-guard/ai.guard.md
  - 10-global/apex.global.md
  - 30-pages/apex.page.md
  - 30-pages/apex.interactive-report.md
  - 30-pages/apex.form.md
  - 40-components/apex.items.md
  - 20-data/apex.sql.md
  - 20-data/apex.logic.md
- Templates:
  - templates/page-examples/interactive-report-page/interactive-report-page._index.md
  - templates/page-examples/form-page/form-page._index.md
  - templates/shared-components/lovs/lovs.dynamic.query.md
  - templates/business-logic/dynamic-actions/dynamic-actions.refresh-region-after-dialog.md
- Required inputs to ask/validate:
  - {{source.table}}: table, pk, columns
  - LOV: source table/view={{lookup.table}}, value={{lookup.valueColumn}}, display={{lookup.displayColumn}}
  - DA: target region identifier (IR region), trigger (after form submit)
- Outputs: internal generate/review/fix loop, then final written under pages/

2) Interactive Report only ({{source.table}} with {{lookup.valueColumn}} filter LOV)
- Input: “Interactive report on {{source.table}} with a {{lookup.valueColumn}} select list filter using Lookup LOV”
- target_type: interactive-report (or page if the user prefers a composed page)
- Components: [interactive-report, lov-shared]
- Rules:
  - 00-guard, 10-global
  - 30-pages/apex.page.md
  - 30-pages/apex.interactive-report.md
  - 40-components/apex.items.md
  - 20-data/apex.sql.md
- Templates:
  - templates/page-examples/interactive-report-page/interactive-report-page._index.md
  - templates/shared-components/lovs/lovs.dynamic.query.md
- Required inputs: {{source.table}}, optional columns; LOV mapping ({{lookup.valueColumn}}->{{lookup.displayColumn}})
- Outputs: internal generate/review/fix loop, then final page

2b) Classic Report region (explicit phrase precedence)
- Input: “Create me a classic report region on Page 1”
- target_type: page
- Components: [classic-report]
- Rules:
  - 00-guard, 10-global
  - 30-pages/apex.page.md
  - 30-pages/apex.classic-report.md
  - 20-data/apex.sql.md
- Templates:
  - templates/region-components/classic-report/classic-report._common.md
  - templates/page-examples/classic-report-page/classic-report-page._index.md
- Required inputs: SQL or table source, optional selected columns
- Routing assertion:
  - Exact phrase `classic report` must route to `classic-report`
  - Must not fall back to generic `interactive-report` mapping
- Outputs: internal generate/review/fix loop, then final page

3) Form only (Modal CRUD on {{source.table}})
- Input: “Modal CRUD form on {{source.table}}; use Lookup LOV for {{lookup.valueColumn}}”
- target_type: form
- Components: [form, lov-shared]
- Rules:
  - 00-guard, 10-global
  - 30-pages/apex.page.md
  - 30-pages/apex.form.md
  - 40-components/apex.items.md
  - 20-data/apex.sql.md
- Templates:
  - templates/page-examples/form-page/form-page._index.md
  - templates/items/select-list/select-list._index.md (if item-level LOV is desired)
  - templates/shared-components/lovs/lovs.dynamic.query.md (if page-level LOV is desired)
- Required inputs: {{source.table}}, pk, columns; LOV mapping
- Outputs: internal generate/review/fix loop, then final page

4) Dashboard with cards (record count by category)
- Input: “Create a dashboard with cards summarizing record count by category”
- target_type: page (or dashboard)
- Components: [dashboard]
- Rules:
  - 00-guard, 10-global
  - 30-pages/apex.page.md
  - 30-pages/apex.dashboard.md
- Templates:
  - templates/page-examples/dashboard-page/dashboard-page._index.md
  - Optional: templates/page-examples/classic-report-page/classic-report-page._index.md (tile-like classic report)
- Required inputs: SQL or table/view for aggregation
- Outputs: internal generate/review/fix loop, then final page

5) Single Chart (amount by category)
- Input: “Chart showing amount by category”
- target_type: chart
- Components: [chart]
- Rules:
  - 00-guard, 10-global
  - 30-pages/apex.chart-page.md
- Templates: (per charts page rules; page template selection happens in that rule logic)
- Required inputs: SQL defining series/category, or table + columns
- Outputs: internal generate/review/fix loop, then final page

6) Calendar ({{source.table}} events)
- Input: “Add a calendar of {{source.table}} events”
- target_type: page
- Components: [calendar]
- Rules:
  - 00-guard, 10-global
  - 30-pages/apex.page.md
- Templates:
  - templates/page-examples/calendar-page/calendar-page._index.md
- Required inputs: date column (e.g., {{source.dateColumn}}), SQL or table mapping
- Outputs: internal generate/review/fix loop, then final page

7) Map (office locations)
- Input: “Create a map for office locations”
- target_type: page
- Components: [map]
- Rules:
  - 00-guard, 10-global
  - 30-pages/apex.page.md
- Templates:
  - templates/page-examples/map-page/map-page._index.md
- Required inputs: lat column, lng column (or geocode source)
- Artifacts: Draft → Critique → Final page

8) Shared LOV (Lookup values)
- Input: “Create a shared LOV that maps {{lookup.valueColumn}} to {{lookup.displayColumn}}”
- target_type: items
- Components: [lov-shared]
- Rules:
  - 00-guard, 10-global
  - 40-components/apex.items.md
  - 20-data/apex.sql.md
- Templates:
  - templates/shared-components/lovs/lovs.dynamic.query.md
  - templates/shared-components/lovs/lovs.dynamic.query.md (if also added to a page)
- Required inputs: table/view={{lookup.table}}, value={{lookup.valueColumn}}, display={{lookup.displayColumn}}
- Outputs: internal generate/review/fix loop, then final under shared-components/

9) Dynamic Action — Refresh IR after submit
- Input: “After form submit, refresh the Interactive Report region”
- target_type: dynamic-action (or included within page composition)
- Components: [dynamic-action-refresh-report]
- Rules:
  - 00-guard, 10-global
  - 20-data/apex.logic.md
- Templates:
  - templates/business-logic/dynamic-actions/dynamic-actions.refresh-region-after-dialog.md
- Required inputs: IR region identifier, trigger = after submit
- Outputs: internal generate/review/fix loop, then final page (DA added to the page artifact)

9b) Translation button intent must clarify before localization routing
- Input: “Create a button to translate to Spanish”
- target_type: unresolved until clarification
- Components: [button-actions-batch, translation]
- Rules:
  - 00-guard, 10-global
  - 40-components/apex.buttons.md
  - 30-pages/apex.page.md
- Templates:
  - none before clarification
- Required inputs:
  - Clarify whether the user wants runtime language switching or text-message localization
  - If runtime switching: target page/region and language
- Routing assertion:
  - Must not auto-route to navigation/menu generation
  - Must not auto-route directly to shared-components localization
  - Must use one simple-English clarification round
- Outputs: no working copy before clarification

9c) Runtime language-switch button
- Input: “Create a button that switches the session language to Spanish”
- target_type: page
- Components: [button-actions-batch]
- Rules:
  - 00-guard, 10-global
  - 40-components/apex.buttons.md
  - 20-data/apex.logic.md
- Templates:
  - templates/buttons/buttons.submit.md
  - templates/business-logic/processes/processes.execute-code.md
- Required inputs:
  - Target page number/alias
  - Region static ID / slot for button placement
  - Button label and target language if not already explicit
- Routing assertion:
  - Default to submit button + guarded page process
  - Must not default to redirect/navigation generation
- Outputs: internal generate/review/fix loop, then final page

10) Negative — Unknown component keyword
- Input: “Add a hexagon grid region with neural shimmer”
- target_type: page
- Components: none matched
- Rules:
  - 00-guard, 10-global, 30-pages/apex.page.md
- Behavior:
  - Agent 1 drafts a static region fallback or asks for clarification
  - Agent 2 flags unsupported component; Agent 3 omits or records deferral

11) AI Assistant Launcher (button + DA + AI agent)
- Input: “Add an AI assistant/chatbot to the home page”
- target_type: page
- Components: [ai-chatbot]
- Rules:
  - 00-guard, 10-global
  - 30-pages/apex.page.md
  - 40-components/apex.buttons.md
  - 20-data/apex.logic.md
- Templates:
  - templates/business-logic/dynamic-actions/dynamic-actions.show-ai-assistant.md
- Required inputs:
  - Target page number/alias
  - Button placement (Breadcrumb/Title Bar) + button identifier
  - AI agent reference (for example `@home`); do not invent missing agent aliases
  - Chatbot agent artifact location: `/shared-components/ai-agents/`
- Behavior:
  - Default implementation is a button + Dynamic Action to open the AI Assistant (no custom chat UI region by default).
- Artifacts: Draft → Critique → Final (DA + button added to the target page)

12) Whole application skeleton creation
- Input: “Create a new APEX application skeleton for project ACME”
- target_type: application
- Components: [application-skeleton]
- Rules:
  - 00-guard/ai.guard.md
  - 10-global/apex.global.md
  - Application output policy from 00-governance.md
- Expected behavior:
  - Provision only the named runtime artifacts for `###/` from `templates/base-app-structure/scaffold-example/`: `.apex/`, `application.apx`, `deployments/`, `page-groups.apx`, `pages/`, `shared-components/`, and `supporting-objects/`.
  - Ensure pages/ contains `p00000-*.apx`, `p00001-*.apx`, and `p09999-*.apx`; `shared-components/` contains the runtime shared-component seed (authentications, lists, breadcrumbs, LOVs, static-files, themes, etc.).
  - Ensure template-family docs and registries such as `README.md`, `_common.md`, `_index.md`, and `.registry.json` do not appear in the generated app root.
  - Omit documentation-only placeholders and optional example attributes unless the prompt explicitly requests them.
  - Update metadata (app name, parsing schema, substitutes) per user context but do not delete skeleton files unless the user explicitly requests it.
- Required inputs to ask/validate:
  - Target schema (parsingSchema)
  - Desired application name/ID or confirm defaults
- Artifacts: Draft → Critique → Final under `###/` preserving only the named runtime-artifact set.

### Validation Checklist per test
- Component keywords resolve to registry entries (synonyms included)
- Union rule loading matches components and respects minimal styling load
- Only existing templates are used
- Missing inputs are requested and logged (no fabrication)
- Artifacts written to the correct locations
- APEXlang runs do not generate unrelated helper source files unless the user explicitly requested tooling/scripts
