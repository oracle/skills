---
name: regions
description: Generate Oracle APEX regions using Tier 1 region workflows (interactive report, dashboard, charts, calendars, maps, dynamic actions). Use when Codex must compose region-level APEXlang artifacts with validated SQL, templates, and refresh behaviors.
---

# Reference Package — Region Workflows

**Parent Entries:** `references/domains/README.md` (domain), `SKILL.md` (router)

This skill orchestrates the Tier 1 region workflows under `skills/` (interactive report, dashboard, charts, dynamic actions, etc.). It mirrors each workflow’s guardrails while coordinating the apexdev internal generate -> review -> fix loop.

---

## Purpose
- Route region-scoped requests to the correct workflow and template set.
- Keep region composition, coupled logic, and acceptance gates aligned with the apexdev master contract.

## Covered Workflows
- `references/domains/page-components/regions/calendar/workflow-calendar-link-targets.md`
- `references/domains/page-components/regions/interactive-report/workflow-interactive-report.md`
- `references/domains/page-components/regions/dashboard/workflow-dashboard.md`
- `references/domains/page-components/regions/chart/workflow-charts.md`
- `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions.md`
- `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions-batch.md`
- `references/domains/page-components/buttons/workflow-button-batch.md`
- `references/domains/business-logic/computations/workflow-computations-batch.md` (when regions rely on computations)
- `references/domains/page-components/regions/form/workflow-modal-crud-form.md` (region-level forms embedded on pages)
- `references/domains/business-logic/processes/workflow-page-processes-batch.md` (invokeApi processes tied to regions)
- `references/domains/universal-attr-config/workflow-server-side-conditions-batch.md`

Use the component registry (`assets/apex-generation/components.registry.json`) to select the appropriate workflow per region request.

---

## Authoritative Policies
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/governance/00-governance.md`
- `assets/rules-mapping.json`
- Load minimal domain rules per request from:
  - `references/policies/memory-bank/10-global/apex.global.md`
  - `references/policies/memory-bank/20-data/apex.sql.md`
  - `references/policies/memory-bank/20-data/apex.logic.md`
  - `references/policies/memory-bank/30-pages/*` relevant to region type

## Operational References
- Region workflows under `references/domains/page-components/regions/**`.
- Cross-domain workflows under:
  - `references/domains/business-logic/**`
  - `references/domains/page-components/buttons/workflow-button-batch.md`
  - `references/domains/universal-attr-config/workflow-server-side-conditions-batch.md`
- Templates from `templates/page-examples/**`, `templates/region-components/**`, and business-logic dynamic-action templates.

## Execution Agents
- `references/ops/sqlcl-agents/00-connection-gate.md` before agent orchestration.
- `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md` for import-ready completion checks.
- The internal generate/review/fix loop remains under `references/workflows/apex-generation/agents/`.
- `references/ops/runtime-gates/01-direct-sqlcl-import.md` for online import runs.

---

## Common Required Inputs
- Region type (IR, chart, dashboard cards, calendar, map, static content, dynamic action archetype)
- Source table/view(s), primary keys, columns, LOV mappings
- Page number and anchor region placement
- Optional calendar create/view link target decisions, including existing-vs-new page choice and any PK/date item mappings
- For dynamic actions: triggering region/item/button, event, action, refresh targets

### Progressive Prompts
1. “Are any regions, buttons, or related items guarded by a server-side condition? (Reply ‘none’ to skip.)”
2. Capture `scope`, `identifier`, catalog `type`, and required attributes per `20-data/apex.logic.md`.
3. For dynamic actions, ask whether refresh or invokeApi batches are needed; gather page lists for batch modes.
4. For calendar `createLink`, ask whether to use an existing form page or create a new same-table modal form page.
5. For calendar `viewEditLink`, ask whether to use an existing report page or create a new report page. If new, ask for report type every time and require a PK item/filter contract.

---

## Rule Loading Sequence
1. `references/policies/memory-bank/00-guard/ai.guard.md`
2. `references/policies/governance/00-governance.md`
3. `assets/rules-mapping.json`
4. Load minimal extras per region type:
   - Interactive report → `30-pages/apex.interactive-report.md`, `20-data/apex.sql.md`
   - Dashboard/cards → `30-pages/apex.dashboard.md`
   - Charts → `30-pages/apex.chart-page.md`
   - Calendar → `30-pages/apex.calendar.md`
   - Modal form region → `30-pages/apex.form.md`, `40-components/apex.items.md`
   - Dynamic actions → `20-data/apex.logic.md`
   - Computations → `references/domains/business-logic/computations/workflow-computations-batch.md`
5. Templates must come from `templates/page-examples/**`, `templates/region-components/**`, and `templates/business-logic/dynamic-actions/**` when applicable.

---

## Agent Pipeline Alignment
- Start with `references/ops/sqlcl-agents/00-connection-gate.md` (Pre-Agent 0).
- Use the apexdev internal generate -> review -> fix loop to produce region artifacts:
  - working changes stay in a transient temp workspace outside the repo
  - internal review enforces SQL validation, UT classes, SSC catalog, process policy split, and confidence `>= 0.95`
  - final publish happens only after the resolved live runtime action succeeds when a live roundtrip is requested
- For import-ready runs, execute `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`.
- After runtime gate pass, call `references/ops/runtime-gates/01-direct-sqlcl-import.md` automatically.

---

## Guardrails
- Validate SQL via `20-data/apex.sql.md`; no inline `select` inside `plsqlExpression`.
- Enforce invokeApi-default for page processes tied to regions, allow the thin-wrapper exception only for page-coupled loaders or branch-gated flows, and enforce executeCode-only for appProcess.
- Dynamic actions should use declarative templates (e.g., `dynamic-action-refresh-report.apx`); avoid inline JS beyond approved locations.
- Report regions that launch modal pages must include an `apexafterclosedialog` dynamic action that refreshes the originating report region.
- Map regions should follow the attached canonical structure from the map family: `layout.slot: body` where the page pattern requires it, `initialPositionAndZoom`, layer `source { ... }`, and `columnMapping.geometryColumnDataType`.
- For standard non-login pages, region `layout.slot` should default to `body`. Use `contentBody` only when the active login or modal page-template contract explicitly requires it.
- Map-layer source modes are:
  - `source { tableName: ... }` for the preferred simple path
  - `source { type: sqlQuery sqlQuery: ... }` for new SQL-backed layers
  - `source { type: functionBody plsqlFunctionBody: ... }` for advanced fallback cases
- Legacy bare `source { sqlQuery: ... }` remains accepted for existing artifacts during transition, but new SQL-backed map layers should emit `source.type: sqlQuery`.
- Charts/calendars must reference existing template files; no new chart types invented.
- Chart routing must use the checked-in chart family entrypoints directly:
  - `templates/region-components/chart/chart._index.md`
  - `templates/region-components/chart/chart._common.md`
  - `templates/region-components/chart/chart._series._common.md`
  - `templates/region-components/chart/chart._axis._common.md`
  - plus exactly one chart-type qualifier file such as `chart.line.md`, `chart.bar.md`, or `chart.area.md`
- For compiler-backed chart lookup, start with the dotted aliases:
  - `--component chart.series`
  - `--component chart.axis`
  - `--component chart.series --group columnMapping`
- Do not query chart `series` or `axis` with `--parent region`; in this runtime the compiler resolves those child contracts under chart `attributes`, so the `parent region` path is a dead end.
- If compiler-backed prop lookup is uncertain for a chart subtype, do not bounce through directory listings or repeated token guesses. Use the chart router and qualifier files above as the canonical drafting path.
- Calendar regions must follow compiler-truth-backed calendar guidance first, normalize the event-label mapping to `displayColumn`, require `settings.pkColumn` from the source table primary key column, keep `endDateColumn` optional even when drag/drop is enabled, restrict `settings.additionalCalendarViews` to `list` and `navigation`, preserve combined UT option values exactly as listed in the template or valid-value catalog, and treat calendar create/edit link targets as user-provided intent rather than something the agent can infer. Use `assets/component-attributes.json` only as fallback/internal validator context.
- Calendar `createLink` and `viewEditLink` requests must follow the explicit clarification workflow for existing-vs-new target pages. New `viewEditLink` report pages must have an explicit report type plus a PK item/filter contract.
- Batch workflows require explicit page lists; stop if missing.
- Record Missing Inputs for absent PKs, LOVs, or SSC attributes.

---

## Outputs & Acceptance Gates
- Regions publish into the resolved page artifact under `applications/app_###/pages/` unless the calling master passes a resolved application path.
- Interactive report completion checks: validated SQL, button/item SSC compliance, optional edit form link consistent with region.
- Dashboard/cards: correct template usage, KPIs respect UT classes.
- Charts: measure/dimension validated, chart dataset defined via templates.
- Dynamic actions: refresh or invokeApi actions wired with proper selectors; guard DML by button/process.
- Batch outputs (buttons/DA/processes) must include change logs summarizing affected pages/components.

---

## Completion Checklist
1. Working region changes stay in the transient temp workspace until review passes.
2. Internal review captures PASS/CONFIDENCE, SQL validation status, and SSC compliance notes.
3. Final region artifacts are published only after required gates pass.
4. Runtime gate executes for import-ready runs.
5. After runtime gate pass, the import gate executes automatically.

---

## Examples
- “Create an interactive report on EMP with modal form for edits and dynamic action to refresh after submit.”
- “Add dashboard cards for Sales KPIs using existing page 10.”
- “Apply dynamic action batch to refresh regions on pages 12, 14, 20 when timer fires.”

---

Use this skill whenever region-level composition or updates are requested within the apexdev orchestration.

## Parallel Skill Contract
- Emit `claims` describing region-level outputs and targeted pages/components.
- Emit `required_inputs` and `assumptions` for unresolved identifiers.
- Emit `source_paths` for every workflow/template path consumed.
- If another parallel skill disagrees on identifiers or dependencies, stop and record `Missing Inputs` instead of guessing.
