---
pageExampleId: dashboard-page
componentType: page
version: 1.0
canonicalExample: ./dashboard-page.example.md
---

# Purpose
Shared contract for the dashboard-page page example.

# Load Order
1. Load ./dashboard-page._index.md
2. Load this file (./dashboard-page._common.md)
3. Load ./dashboard-page.example.md for the concrete Markdown-preserved example
4. When generating KPI strips, load `templates/template-components/metric-card/metric-card._index.md`

# Rules
- Keep dashboard-page.example.md as canonical Markdown-preserved example for this page pattern.
- Apply only the component templates/rules required by the user prompt.
- Do not copy optional regions/items/processes unless requested.

# Dashboard Contract
- This page example represents the Create App dashboard contract (`pageType: dashboard`) with chart widgets modeled as chart regions.
- Dashboard KPI widgets default to the Metric Card template component (`type: themeTemplateComponent/metricCard`) unless the user explicitly specifies native Cards.
- Generate KPI strips as one Metric Card region with `componentAppearance { display: report }`, one normalized SQL source row per metric, `settings.title` and `settings.metric` bound to projected columns, and explicit child `column (...)` blocks for every projected field.
- Dashboard KPI Metric Card strips default to `appearance.template: @/blank-with-attributes`; use `@/standard` only when the requested design explicitly needs titled or landmarked visible region chrome.
- Omit Metric Card `settings.layout` by default. When the user requests specific layout/count behavior, use only `stacked`, `2Columns`, `3Columns`, `4Columns`, `5Columns`, `autoWrapping`, or `overflow`.
- Use native `type: cards` for entity, media, or navigation card grids, or when the user explicitly requests native Cards.
- Allowed dashboard widget chart types are `area`, `bar`, `line`, and `pie`.
- Dashboard generation must create a `layout_row_plan` before emitting KPI strips, chart rows, report/detail rows, or side-by-side component rows. For five charts, the default chart portion is one `two-up-equal` row followed by one `three-up-equal` row.
- The layout row plan must list slot, row key, recipe, and ordered region static IDs, for example `layout_row_plan: [{ slot: body, row: kpi-strip, recipe: metric-card-strip, regions: [dashboard-kpis] }, { slot: body, row: analytics-1, recipe: two-up-equal, regions: [orders-by-status, sales-share-by-store] }]`.
- Each layout row plan entry is one physical row. Stacked full-width detail, contextual summary, and cards sections must be emitted as separate one-region entries; do not group them under one `stacked-content` entry.
- Do not emit `dashboard-chart-flow`; split charts into explicit `two-up-equal` and `three-up-equal` entries.
- Do not literally stack multiple dashboard charts unless the user explicitly requests vertical stacking or a chart is intentionally a detail/full-width section.
- Equal-width BODY sibling rows use implicit flow with `startNewRow: false` on second-and-later regions and omit explicit `column` / `columnSpan`.
- Keep the fenced APEXlang example compiler-truthful and comment-free.

# Conditional Guidance

## When to include
- Use this page example when requirements match this page family's region and process composition.
- Start from dashboard-page.example.md and keep only requested regions/logic.
- Preserve canonical sequencing/order for processes, dynamic actions, and major regions unless prompt requires change.

## Do not generate
- Do not load unrelated page-example families for this request.
- Do not replicate all optional blocks from dashboard-page.example.md by default.
- Do not introduce page-level behavior that contradicts memory-bank rules for the selected page type.
