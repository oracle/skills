# Screenshot Pattern to APEX Component Mapping

Map screenshot regions to the narrowest safe native APEX primitive region only after the full layout tree has been derived. This reference chooses region types; it must not drive or alter the already-established region structure.

## Mapping Contract
- Treat the layout tree as fixed input.
- Treat the lane tree and any outer or nested structural placeholder regions as fixed input before mapping visible regions.
- Component mapping may choose only the region type and the nearest native APEX primitive behavior.
- Component mapping must not collapse, merge, reorder, resize, or omit regions that were already derived from the screenshot.
- Component mapping must not change the top-level row plan or replace a same-row sibling relationship with a vertical stack.
- Component mapping must not bypass established outer or nested lane placeholders once the structural scaffold has been chosen.
- Native primitive regions are the required first-choice targets, including Metric Card template components for KPI strips, cards, interactive reports, classic reports, charts, lists, form regions, page items, and buttons.
- When mapping confidence is low, preserve the same region position and size intent and use a `staticContent` region instead.
- When one preserved region contains several nearby aggregate metrics, map it to one grouped `themeTemplateComponent/metricCard` region with one normalized SQL query that returns multiple rows as the default choice.
- When one preserved region contains several nearby entity, media, or navigation cards, map it to one grouped native `cards` region with one SQL query that returns multiple rows as the default choice.
- Do not create one region per metric, one cards region per entity card, or one staticContent region per metric unless the screenshot clearly shows distinct containers separated into different regions.

## Common Mappings
- Page title + top-right actions:
  - Use the page title area plus buttons associated with the breadcrumb or title region when supported by the target page pattern.
- Search/filter strip with labeled inputs:
  - Use a form-style region with page items.
- Tabular data listing:
  - Prefer interactive report.
  - Use interactive grid only when the screenshot clearly suggests inline editing.
- KPI tiles or summary counts:
  - First try one grouped `themeTemplateComponent/metricCard` region backed by one normalized SQL query when the metrics sit close together in the same region.
  - Fall back to one region per metric only when the screenshot clearly gives each metric its own container.
- Detailed record editor:
  - Use a form region.
- Side filter panel + main content:
  - Use an asymmetric sidebar/main split.
- Chart areas:
  - Use chart regions only when the chart type is clear enough from the screenshot.
- Utility panels made of links or tasks:
  - Prefer a shared list plus a native `list` region.
  - Create shared list entries from the visible labels before falling back to `staticContent`.
- Search or filter form areas:
  - Prefer real page items for visible controls and real buttons for visible actions.
  - Keep related controls together in one shared form or structural layout container.
- Hero + feature + form pages:
  - Preserve the visible row order: hero copy, feature cards, form controls, then action row.
- Mixed utility panel with unclear internal widget type:
  - Use a placeholder static region.

## Placeholder Static Region Rules
- Use a placeholder static region when:
  - the section is visibly important
  - the label or purpose is partially clear
  - the exact APEX component type is uncertain
- Preserve the region position, grouping, nesting, and size intent from the layout tree.
- Use `staticContent`.
- Include concise descriptive placeholder text such as:
  - `Placeholder for shipment status timeline.`
  - `Placeholder for custom operations heatmap.`
  - `Placeholder for exception review workspace.`
- Label the region clearly, for example:
  - `Activity Timeline Placeholder`
  - `Custom Metrics Panel Placeholder`
  - `Map or Visual Panel Placeholder`
- Keep the placeholder structural and descriptive.
- Do not embed HTML, custom markup, fake widget code, or decorative markup that tries to imitate the screenshot.
- Do not use HTML fallback for mapped regions either.
- Do not use placeholder prose to simulate card badges, report rows, chart bars, form layouts, or other primitive-region UI.

## Confidence Heuristics
- High confidence:
  - obvious forms, reports, cards, buttons, tabs, or charts
- Medium confidence:
  - a structured panel whose purpose is visible but whose exact behavior is unclear
  - choose the closest safe native primitive region
- Low confidence:
  - bespoke widget, unreadable text, or decorative composite control
  - emit a placeholder static region without changing the region layout

## Layout Heuristics
- Top-level page rows:
  - preserve the screenshot's row count and row membership before component choice
  - do not wrap separate page rows in a synthetic parent unless the screenshot shows one framed parent container
- Lane tree first:
  - determine the page-wide outer lanes or columns before assigning component families
  - determine whether any parent lane owns recurring child lanes or sub-columns
  - keep outer and inner structural placeholders in place once they are chosen
- Balanced sibling panels:
  - use implicit equal-width flow
- Uneven sidebar/main or 3-zone composition:
  - use explicit `column` and `columnSpan`
  - keep those panels as same-row siblings rather than stacked full-width regions
- Multi-column outer scaffolds:
  - support one, two, three, or more outer structural lanes when the screenshot alignment depends on stable page-wide columns
  - `LEFT`, `CENTER`, `RIGHT`, `MAIN`, `RAIL`, `TOP_LEFT`, and similar names are examples only, not a fixed catalog
- Anchored sidebar stacks:
  - keep each framed sidebar panel as its own top-level BODY region
  - anchor repeated sidebar peers to the same right-side columns with explicit placement when needed
  - do not hide those peers inside a synthetic sidebar wrapper
  - treat this as one special case of the broader lane-tree model, not the default shape for every multi-column page
- Constrained lower workspace rows:
  - when two or more panels sit below the main workspace and together match the workspace width, preserve that shared width budget
  - if needed, use a minimal invisible parent container for the constrained row, then place the child panels inside it with implicit equal-width flow
- Stacked lane containers:
  - when multiple visible regions belong to the same vertical lane, allow a minimal outer structural region for that lane
  - outer lane regions must use `@/blank-with-attributes`
  - outer lane regions are structural only and must not add visible chrome
  - the pattern is not limited to two columns; use as many structural placeholder regions as needed for the screenshot topology
- Nested child-lane containers:
  - when a parent lane contains recurring inner columns, allow nested structural placeholder regions for those child lanes
  - nested child-lane regions must also use `@/blank-with-attributes`
  - nested child-lane regions are structural only and must not add visible chrome
  - prefer nested structural placeholders when they preserve recurring alignment more cleanly than repeated explicit placement
- Dense page with clear visual sections:
  - preserve the section order and region boundaries even if some areas must become placeholders
- Metric or KPI strips:
  - treat one visually grouped strip as one region first, then use one `themeTemplateComponent/metricCard` region with one normalized source row per metric
  - do not remap a grouped strip into one static region per metric when Metric Card is still a safe native mapping
- Entity, media, or navigation card groups:
  - treat one visually grouped block as one region first, then use one native `cards` region with multiple rows inside it
- Actions or links panels:
  - if the content reads as a vertical list of navigation or task options, model it as a shared list and render it with a `list` region
  - reserve `staticContent` for utility panels whose internal widget type is still unclear after inspection
