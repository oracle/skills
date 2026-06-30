# Page Layout Standards

## Purpose
Defines the default region layout contract for page generation so APEXlang pages use the native 12-column flow efficiently instead of over-specifying grid coordinates.

This file applies to generated application page artifacts, templates, and non-modal page layouts unless a page-type rule defines a narrower contract.

## Layout Scopes
Each layout container owns its own 12-column grid. Evaluate `column` and `columnSpan` only within the current scope.

Supported scopes:
- page slot rows, for example top-level BODY regions
- nested region rows grouped by `layout.parentRegion + layout.slot`
- item rows grouped by `layout.region + layout.slot`
- button rows grouped by `layout.region + layout.slot`

Parent and child spans never add together across scopes. A parent region may consume part of the page grid, while items, buttons, or nested regions inside that parent still get their own local 12-column budget.

## Default Rule
- Prefer implicit flow for equal-width sibling components within the current scope.
- Use `layout.sequence` to control order.
- Use `layout.startNewRow: false` on the second and later components in the same row.
- Omit `layout.column` and `layout.columnSpan` for equal-width rows.

## Page-Template-First Shell Rule
- When the requirement is a true shell composition such as sidebar + main content, side rail + body, or left rail + stacked detail, evaluate the page template family before reaching for explicit body-grid coordinates.
- Prefer a page template with semantic slots such as `leftColumn` + `body` only for documented filter/sidebar shells such as faceted search. Master-detail Content Row workbenches use the standard page template plus a BODY grid split.
- For Theme 42 side-column page templates, treat the rail width as a fixed build-pinned shell detail of about `15rem`; if that width is not suitable, prefer explicit body-grid coordinates instead of trying to stretch the page-template rail.
- Side-column page templates are especially appropriate when the rail content is meant to select, filter, or switch the content shown in the main body, such as contextual sub-navigation, parent selectors, or section choosers.
- When a side rail provides contextual sub-navigation across a local page group, repeat that sub-navigation on each linked page in the group instead of showing it only on the landing page.
- Use explicit `column` and `columnSpan` in `body` only when the required width ratio, stacking pattern, or page family cannot be expressed cleanly by the page template shell.
- Do not default the left region to `column: 1`; a first region in a scoped row may declare only `columnSpan` when that is sufficient.

## Equal-Width Row Recipes
- `stack`
  - One region per row.
  - Omit `startNewRow`, `column`, and `columnSpan`.
- `two-up-equal`
  - First region in row: omit `startNewRow`.
  - Second region in row: `startNewRow: false`.
  - Omit `column` and `columnSpan` on both.
- `three-up-equal`
  - First region in row: omit `startNewRow`.
  - Second and third regions: `startNewRow: false`.
  - Omit `column` and `columnSpan` on all three.
- `kpi-strip`
  - Use the same equal-width flow rules as `three-up-equal`, extended to the number of KPI siblings in the row.
  - Prefer 2-6 KPIs in one row when labels are short and content is single-value.

## When Explicit Grid Coordinates Are Allowed
Use `layout.column` and `layout.columnSpan` only for intentionally asymmetric layouts within the current scope, such as:
- sidebar + main content
- faceted search
- parent-child split
- wizard or modal shell-specific positioning
- prompt-explicit uneven widths

Allowed asymmetric examples:
- `sidebar-main`: 3/9 or 4/8
- `parent-child-split`: 4/8
- `master-detail-content-row`: standard page template; parent Content Row in `BODY` at `columnSpan: 3` or `4`, followed by the child region in the same body row with `startNewRow: false`
- `three-zone`: 3/6/3

## Mixed-Layout Interpretation
- Within one scoped row, do not mix fully implicit equal-width flow with explicit-grid placement.
- However, allow the anchored-sibling asymmetric pattern:
  - the first region may declare `columnSpan` only
  - later sibling regions in the same row may declare `column`
- Treat `columnSpan` on the first sibling plus `column` on a later sibling as a valid asymmetric row pattern, not invalid mixed layout.
- Use this exception only when the row is intentionally asymmetric. Equal-width rows still omit explicit coordinates.

## Generation Contract
- Generated `applications/**` artifacts are subject to deterministic layout linting; do not treat final app files as exempt from these rules.
- For standard non-login pages, top-level regions should use `layout.slot: body`.
- Reserve `layout.slot: contentBody` for login and modal-dialog page-template contracts that explicitly define that semantic slot.
- Decide the row recipe per layout scope before emitting components.
- For equal-width rows, do not emit fallback coordinates "just to be safe".
- Do not mix implicit-flow and explicit-grid placement within the same scope row unless the pattern is intentionally asymmetric.
- If a row is equal-width, the first component must omit `startNewRow`; later siblings in that row must set `startNewRow: false`.
- The total explicit `columnSpan` in any single row must never exceed 12 within that scope.

## Analytical Page Defaults
- KPI strips: equal-width flow by sequence.
- Dashboards must create a `layout_row_plan` before emitting KPI strips, chart rows, report/detail rows, or side-by-side component rows.
- `layout_row_plan` entries must include `slot`, `row`, `recipe`, and ordered `regions` static IDs.
- Each `layout_row_plan` entry is exactly one physical row. Stacked full-width detail, contextual summary, and cards sections each get their own one-region entry; do not put multiple stacked sections in the same `regions` array.
- Two charts: one `two-up-equal` row.
- Three charts: one `three-up-equal` row.
- Four charts: two `two-up-equal` rows.
- Five charts: one `two-up-equal` row, then one `three-up-equal` row.
- More than five charts: repeat `two-up-equal` and `three-up-equal` rows, preferring balanced rows.
- In each chart row, the first chart omits `startNewRow`; second-and-later charts in that row use `startNewRow: false`.
- Do not literally stack multiple dashboard charts unless the prompt explicitly requests vertical stacking or a chart is intentionally a detail/full-width section.
- Detail/report sections below KPIs/charts: `stack` unless the prompt explicitly requests a split.

## Master-Detail Content Row Defaults
- When a parent Content Row selects context for a child report, use a left/right parent-child split instead of stacked full-width regions.
- Emit the parent Content Row first with `layout.columnSpan: 3` or `4`; omit `layout.column` unless another region in the same scope requires an explicit start column.
- Emit the child report second with `layout.startNewRow: false`; do not add redundant `column` / `columnSpan` unless a runtime or template-specific contract requires explicit coordinates.
- Place parent-context page items as hidden technical items, not as visible body controls, unless the prompt explicitly requests a manual selector.
- Place create/edit/detail buttons for the child context inside the child report toolbar slot instead of laying them out in body-grid columns.
- Place primary page-level create actions in the breadcrumb/title-bar region when the page has a breadcrumb region; do not anchor them to an unrelated child report.

## Asymmetric Layout Recipes
- `sidebar-main-stacked-detail`
  - Choose the page-template shell version first when a page template can express the requested left rail + main body composition closely enough.
  - Template-shell version:
    - sidebar or parent context region: `layout.slot: leftColumn`
    - main detail/report regions: `layout.slot: body`
  - Explicit body-grid version:
    - left region first: `layout.columnSpan: 4`
    - right top region: `layout.column: 5`, `layout.startNewRow: false`
    - right stacked sibling below: `layout.column: 5`
  - Do not force `layout.column: 1` onto the left region for this recipe.
  - Do not treat `columnSpan` on the left region plus `column` on the right siblings as invalid mixed layout.

## Asymmetric Layout Recipes
- `sidebar-main-stacked-detail`
  - Choose the page-template shell version first when a page template can express the requested left rail + main body composition closely enough.
  - Template-shell version:
    - sidebar or parent context region: `layout.slot: leftColumn`
    - main detail/report regions: `layout.slot: body`
  - Explicit body-grid version:
    - left region first: `layout.columnSpan: 4`
    - right top region: `layout.column: 5`, `layout.startNewRow: false`
    - right stacked sibling below: `layout.column: 5`
  - Do not force `layout.column: 1` onto the left region for this recipe.
  - Do not treat `columnSpan` on the left region plus `column` on the right siblings as invalid mixed layout.

## Anti-Patterns
- Do not emit `column: 1`, `columnSpan: 6`, `column: 7`, `columnSpan: 6` for a simple two-up row.
- Do not assign explicit `column` / `columnSpan` to every sibling on a dashboard when APEX native flow can place them correctly.
- Do not omit `startNewRow: false` from second-or-later equal-width siblings.
- Do not add child spans to parent spans when validating a row budget; each scope resets to 12 columns.
- Do not model master-detail parent selection as a visible select list plus a separate full-width child report when a Content Row parent list is the primary browse affordance.
