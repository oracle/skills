# Workflow: Dashboard (KPIs/Cards)

Purpose
- Create dashboards with KPI regions/cards and consistent layout.

Required inputs
- KPI definitions, source queries, layout hints.

Clarify — progressive prompts
- Will any dashboard regions, buttons, or items use a server-side condition? (Answer "none" to skip.)
- If yes, state the component scope (region, button, item, dynamic action, or process) and identifier.
- Provide the desired condition type or business rule, referencing references/policies/memory-bank/20-data/apex.logic.md for valid options.
- Collect the required attributes for that type (item, value/list, request value, plsqlExpression, sqlQuery, etc.). Missing answers block the workflow.

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md
- references/policies/memory-bank/30-pages/apex.layout.md
- references/policies/memory-bank/30-pages/apex.dashboard.md
- references/policies/memory-bank/20-data/apex.sql.md

Layout defaults
- Build a row plan before emitting regions.
- Create a required `layout_row_plan` before emitting KPI strips, chart rows, report/detail rows, or side-by-side component rows.
- `layout_row_plan` entries must include `slot`, `row`, `recipe`, and ordered `regions` static IDs.
- KPI strips use one normalized Metric Card region with `recipe: metric-card-strip`.
- Each `layout_row_plan` entry represents one physical row. Stacked full-width detail, contextual summary, and cards sections must be separate one-region entries; do not list multiple stacked sections in the same `regions` array.
- Do not emit a generic `dashboard-chart-flow` recipe; split charts into explicit `two-up-equal` and `three-up-equal` entries.
- Dashboard KPI Metric Card strips default to `appearance.template: @/blank-with-attributes`; use `@/standard` only when explicitly titled or landmarked visible region chrome is required.
- Default chart rows:
  - 2 charts: one `two-up-equal` row.
  - 3 charts: one `three-up-equal` row.
  - 4 charts: two `two-up-equal` rows.
  - 5 charts: one `two-up-equal` row, then one `three-up-equal` row.
  - More than 5 charts: repeat `two-up-equal` and `three-up-equal` rows, preferring balanced rows.
- First chart in each row omits `startNewRow`; second-and-later charts in that row use `startNewRow: false`.
- Do not literally stack multiple dashboard charts unless the user explicitly requests vertical stacking or a chart is intentionally a detail/full-width section.
- Equal-width sibling rows must use sequence ordering plus `startNewRow: false` on second-and-later siblings.
- Do not emit `column` / `columnSpan` for KPI strips or standard two-up / three-up dashboard rows.
- Use explicit coordinates only when the requested dashboard is intentionally asymmetric.

Composition reference
- references/policies/memory-bank/40-components/apex.templates.md

References
- references/policies/governance/00-governance.md
- assets/rules-mapping.json

Completion
- After Revision, prompt for ``db_connection_name`, `app_path`, and `application_id` if missing, run `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`, then invoke `references/ops/runtime-gates/01-direct-sqlcl-import.md`.
- Fail the workflow if a requested server-side condition is not mapped to a catalog type or lacks the required attributes.
