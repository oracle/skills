# Dashboard Standards

Rules and conventions for creating and maintaining Oracle APEX Dashboard Pages.
All dashboard pages must be a non-modal page and based on `templates/page-examples/dashboard-page/dashboard-page.example.md`.

Keywords: dashboard, kpi, summary, cards, chart, filters, smart filters

---

## Purpose and Scope
Define a consistent pattern for Dashboard pages that surface KPIs, charts, and summary information. Dashboards prioritize glanceable metrics and quick filtering, not data entry.

---

## General
- Always start from `templates/page-examples/dashboard-page/dashboard-page._index.md`, then load the shared contract and example as needed.
- Dashboard pages are non-modal (normal pages)
- Refer to `apex.page.md` for navigation and naming
  - Add Navigation List entry (non-modal)
  - Add Breadcrumb entry (non-modal)
- Avoid custom behaviors when a standard region type or attribute is available

---

## Standard Composition (Recommended Pattern)
Top to bottom, left to right:
1) Hero alert / intro region (static content) to frame the dashboard’s purpose.
2) Filters at the top of BODY
   - Option A: Smart Filters region (for multi-attribute search across many regions). Follow `apex.smart-filter-search.md`.
   - Option B: Simple select list/s as page items driving refresh of regions
3) Primary results region (classic report or media list) for contextual detail.
4) KPI Metric Cards (themeTemplateComponent/metricCard) for aggregate KPIs, summary counters, and metric strips.
5) One or two Charts (side-by-side on the same grid row when space allows)

Grid and layout rules:
- APEX 12-column grid applies
- Apply `30-pages/apex.layout.md` as the default contract
- Keep each row’s total `columnSpan` ≤ 12 when explicit spans are intentionally used
- Use `startNewRow: false` to place equal-width siblings side-by-side
- Omit `column`/`columnSpan` unless the row is intentionally asymmetric
- Dashboard pages with KPI strips, chart rows, report/detail rows, or side-by-side component rows must define a `layout_row_plan` before emitting regions.
- The artifact must match the `layout_row_plan`: first region in each row omits `startNewRow`; second-and-later regions in the same row set `startNewRow: false`.
- Treat `startNewRow: false` on the first region of a planned dashboard row as a layout failure because it collapses the row into the previous visual group.
- A `layout_row_plan` entry represents one physical row, not a group of stacked rows. Full-width stacked detail, contextual summary, and cards sections must be separate one-region row-plan entries; never list multiple stacked full-width regions in one entry.
- Do not use a generic `dashboard-chart-flow` recipe. Split dashboard charts into explicit `two-up-equal` and `three-up-equal` row entries.
- Default dashboard rows:
  - KPI strips: equal-width implicit flow
  - 2 charts: one `two-up-equal` row
  - 3 charts: one `three-up-equal` row
  - 4 charts: two `two-up-equal` rows
  - 5 charts: one `two-up-equal` row, then one `three-up-equal` row
  - More than 5 charts: repeat `two-up-equal` and `three-up-equal` rows, preferring balanced rows
  - detail regions below analytics: stacked full-width, one row-plan entry per full-width region
- For each chart row, the first chart omits `startNewRow`; second-and-later charts in that row use `startNewRow: false`.
- Do not literally stack multiple dashboard charts unless the user explicitly requests vertical stacking or a chart is intentionally a detail/full-width section.

Example layout row plan:
```yaml
layout_row_plan:
  - slot: body
    row: kpi-strip
    recipe: metric-card-strip
    regions: [dashboard-kpis]
  - slot: body
    row: analytics-1
    recipe: two-up-equal
    regions: [orders-by-status, sales-share-by-store]
  - slot: body
    row: analytics-2
    recipe: three-up-equal
    regions: [orders-by-month, top-products, sales-trend]
```

---

## KPI / Detail Regions
Authoritative references:
- Metric Card template component:
  - Use `themeTemplateComponent/metricCard` for aggregate numeric KPI strips, summary counters, and normalized multi-metric dashboard widgets.
  - A single Metric Card region can render multiple KPI cards from one normalized SQL source.
  - Dashboard KPI Metric Card strips default to `appearance.template: @/blank-with-attributes`; use `@/standard` only when explicitly titled or landmarked visible region chrome is required.
  - Supported `settings.layout` values are `stacked`, `2Columns`, `3Columns`, `4Columns`, `5Columns`, `autoWrapping`, and `overflow`.
  - Omit `settings.layout` by default; emit it only when the user requests a specific layout/count behavior or the page pattern has a concrete layout requirement.
- Managing Cards (Oracle APEX App Builder documentation)
  - Use native `type: cards` only when the user explicitly asks for Cards/native cards or when the dashboard content is an entity, media, or navigation card grid.
  - Native Cards support icons, badges, media, and actions for entity-style lists.
- Managing Classic Reports / Media Lists for summary views

Rules and guidance:
- Default aggregate KPI strips to one Metric Card region backed by one SQL query.
- Normalize multi-metric KPI strips with one row per metric, commonly using `UNION ALL` across per-metric SELECTs that project the same aliases in the same order.
- Do not emit aggregate KPI tiles as `classicReport` regions. A query that projects `metric_value`, `metric_title`, or similar single-value KPI aliases belongs in `themeTemplateComponent/metricCard`.
- Display concise metric values with a short title and optional meta text.
- Emit explicit Metric Card child `column (...)` metadata for every projected field.
- Use native `type: cards` for KPI-like tiles only when the user explicitly specifies Cards/native cards; otherwise reserve Cards for entity/media/navigation card grids.
- If the dashboard centers on a task/status list, use a classic report or template-component content row/media-list pattern and keep KPI Metric Cards optional.
- Use minimal SQL that returns only the fields needed by the Metric Card, card, report, or chart attributes.

---

## Charts
See `apex.chart-page.md` for chart options and patterns.

Rules and guidance:
- Choose chart type appropriate to the metric: `bar`, `line`, `area`, `pie`, `combination`.
- Combination charts must specify the correct series type (line/area/bar) and supply axis definitions (x, y, y2) when dual axes are used.
- Before emitting dashboard KPI strips, chart rows, report/detail rows, or side-by-side component rows, create a `layout_row_plan` that assigns each region to a row recipe.
- Follow the dashboard chart row defaults from this file and `apex.layout.md`; for five charts, use one `two-up-equal` row followed by one `three-up-equal` row.
- Vertical chart stacking is valid only when the prompt explicitly requests it or when a chart is intentionally a full-width detail section below the analytical row set.
- If the dashboard has filter items, ensure each chart series’ source submits filter items:
```
    source {
        ...
        pageItemsToSubmit: PXX_FILTER
    }
```
- Keep chart queries aggregated and performant (aggregate in SQL; avoid row-by-row logic).
- Use `legend.position: end` and `hideAndShowBehavior: noRescaling` when mimicking the canonical dashboard to preserve layout stability.

---

## Filters
Two approved filter patterns:

1) Smart Filters (Oracle APEX)
   - Single search field with compact UI; results can be cards, classic report, map, or calendar
   - Use when users need multi-attribute search across multiple regions
   - Create a Smart Filters region and associate it with the target result region
   - Adhere to standards in `apex.smart-filter-search.md`

2) Page Item Filters + Dynamic Actions
   - Use one or more select-list (or similar) items to filter charts/cards
   - Add a Dynamic Action on item change to refresh affected regions
   - Each affected region must submit the filter items in its source (`pageItemsToSubmit`)
   - Example pattern is implemented in `templates/page-examples/dashboard-page/dashboard-page.example.md` using `P60_FILTER` and a refresh DA

Selection guidance:
- Prefer Smart Filters for search-like dashboards and many facets.
- Prefer simple page items for one or two clear filter dimensions.
- When a dashboard is sourced from demo schemas (`EBA_DEMO_*`), ensure filter LOVs return the correct demo values (e.g., project names, stores) and wrap them in views if re-used.

---

## Dynamic Actions (Refresh Pattern)
- Create a DA with event scope dynamic on filter item change
- Add a refresh action per affected region (cards, charts, reports)
- Ensure the targeted regions list all controlling items in `pageItemsToSubmit`

---

## Navigation and Breadcrumb
- Non-modal dashboards require:
  - Navigation List entry (see `shared-components/lists.apx`)
  - Breadcrumb entry (see `shared-components/breadcrumbs.apx`)
- Follow `apex.page.md` for naming and hierarchy

---

## AI Assistant (Chatbot) — Dashboard Entry Pattern
- If a prompt asks to “add a chatbot/AI assistant to the dashboard”, **do not** create a custom chat UI region by default.
- Implement as:
  - A Breadcrumb/Title Bar button (top of page), and
  - A Dynamic Action on that button click to open the AI Assistant (template: `templates/business-logic/dynamic-actions/dynamic-actions.show-ai-assistant.md`, prefer `genAI { agent: @AGENT }`).
  - Resolve the target AI agent from `/shared-components/ai-agents/`.
- Only implement inline embedded assistant rendering when the user explicitly requests it and provides/approves the container selector + DOM id pattern.

---

## Data and Performance
- Minimize query cost on dashboards; prefer aggregated views or materialized views
- Push heavy logic to SQL views/packages (see `20-data/apex.sql.md`, `20-data/apex.logic.md`)
- Avoid expensive per-card queries; one well-structured query per region is preferred
- For time-series charts, aggregate at appropriate granularity (for example, TRUNC(date) for daily)

---

## Styling
- Use only UT region classes documented in memory bank:
  - `t-Region`, `t-Region-header`, `t-Region-body`
- Do not invent CSS classes. If additional classes are required, they must be added to the memory bank first
- Keep template defaults for region appearance unless a documented standard requires change

---

## Implementation Defaults
- Template path: `templates/page-examples/dashboard-page/dashboard-page.example.md`
- Include:
  - A Breadcrumb region using the title-bar template.
  - An optional hero/alert region for dashboard context.
  - Filters: either Smart Filters or one/more select list items (example: `P60_FILTER`).
  - A primary detail region (classic report/media list) or KPI Metric Card region.
  - Chart regions arranged by `layout_row_plan`; side-by-side by default for multi-chart dashboards.
  - A Dynamic Action to refresh all affected regions when a filter changes.
- For each region affected by filters, set `pageItemsToSubmit` to all controlling page items.
- When duplicating demo dashboards, preserve template option combinations (e.g., `t-Region--scrollBody`, `i-h320`) for consistent height/scrolling.

---

## Example From Template (what to emulate)
From `templates/page-examples/dashboard-page/dashboard-page.example.md`:
- A Metric Card KPI strip backed by normalized SQL with one row per metric.
- Chart regions for visual analytics.
- For equal-width sibling rows, rely on sequence plus `startNewRow: false` instead of explicit `column` / `columnSpan`

---

## Do and Don’t
Do:
- Keep dashboards glanceable: short labels, large values, minimal chrome
- Reuse the shared template and patterns for consistency
- Use native Cards actions to drill into details when the dashboard intentionally contains entity/media/navigation cards

Don’t:
- Add components to Global Page 0 for dashboard-specific needs
- Bypass Smart Filters when complex multi-attribute search is needed
- Embed heavy PL/SQL in region sources; prefer SQL with views

---

## Policy — Cards Regions (Non-negotiable)
- This policy applies only when a native `type: cards` region is intentionally selected, such as for entity, media, or navigation card grids. It does not make native Cards the default for aggregate KPI strips.
- For regions with type: cards:
  - Set appearance.template: cards-container on the Cards region.
  - Do not use @/cards; always use @/cards-container.
  - Use only cards attributes validated by the current compiler contract.
  - `componentAppearance.gridColumns` is optional and may be set only to `2`, `3`, `4`, or `5` when the dashboard needs a fixed cards grid.
  - Omit `componentAppearance.gridColumns` when cards should auto-determine the column count.
  - When `title.htmlExpression`, `subtitle.htmlExpression`, `body.htmlExpression`, or `secondaryBody.htmlExpression` is emitted, set that same block's `advancedFormatting: true`.
  - Inside cards `title.htmlExpression`, `subtitle.htmlExpression`, `body.htmlExpression`, and `secondaryBody.htmlExpression`, use `&COLUMN.` substitution strings, not `#COLUMN#`. Prefer escaped substitutions such as `&COLUMN!HTML.` for text values.
  - Do not emit report-style pagination or inferred card key properties unless parser-confirmed.
  - Do not emit `performance.maxRowsToProcess` for cards regions unless the cards DSL contract explicitly allows it.
  - Card action links must use &EDIT_LINK (never #EDIT_LINK#).
  - The region SQL must compute EDIT_LINK using apex_page.get_url and expose it in the SELECT list, for example:
    ```sql
    apex_page.get_url(
      p_page   => :TARGET_PAGE,
      p_items  => :TARGET_ITEMS,
      p_values => :TARGET_VALUES
    ) as EDIT_LINK
    ```
  - Set action.behavior.target: &EDIT_LINK

## References
- Oracle APEX Cards documentation
- Oracle APEX Smart Filters documentation
