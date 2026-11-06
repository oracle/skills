# Screenshot-to-Layout Workflow

Use this workflow to turn one screenshot into one APEXlang page draft by deriving the exact region layout first and assigning native APEX primitive region types second.

## Inputs
- Screenshot file at `image_path`
- Existing target app at `app_path`
- `page_id`
- `page_title` or slug
- Optional notes

Before drafting the page, inspect the target app's shared navigation and breadcrumb files so the new page can be integrated using the same shared-component containers and concrete target format already present in that app.

## Workflow
1. Inspect the screenshot and identify:
   - page title area
   - major regions
   - actions
   - filters or forms
   - reports, cards, charts, and detail areas
2. Write a top-level BODY row plan before mapping components:
   - which regions belong to row 1
   - which regions belong to row 2
   - which regions belong to row 3
   - where the screenshot shows an asymmetric split such as main area plus right rail
3. Run an explicit lane-tree pass before choosing visible region types:
   - determine the page-wide outer columns or lane groups first
   - determine whether any parent lane contains nested child columns that need their own structural placeholders
   - create outer and inner placeholder regions before planning visible descendants
   - preserve alignment through shared structural parents rather than rebuilding the same columns row-by-row
4. Convert the screenshot into a fully nested layout tree before choosing any APEX component:
   - top-level rows
   - outer lane membership for each visible region
   - nested child-lane membership where a parent lane owns inner columns
   - sibling groups within each row or lane scope
   - nested content blocks when visibly framed together
   - width/span intent for each region
5. Choose the row recipe for each scope so the emitted APEX page preserves the derived layout:
   - `stack`
   - `two-up-equal`
   - `three-up-equal`
   - explicit asymmetric split only when visually obvious
   - anchored sidebar stack: repeated top-level BODY peers fixed to the same right-side columns
   - constrained subordinate row: a minimal invisible container that preserves the main-workspace width for a lower two-up row
   - stacked lane container: a minimal invisible structural region that owns one vertical lane of child regions
   - 3-column dashboards may require three outer structural placeholders before any visible regions are placed
   - a main workspace plus right rail may also require nested child placeholders inside the main workspace for lower two-up or three-up rows
   - center-focused layouts may still use left and right support lanes when the screenshot alignment depends on them
   - multi-row pages may reuse the same outer lanes while only some parent lanes contain nested child columns
6. Freeze the structural scaffold and region layout tree once the structure is clear.
7. Map each preserved region to the nearest native APEX primitive region family first.
8. When a preserved region is a cluster of nearby aggregate metrics, emit one grouped `themeTemplateComponent/metricCard` region with one normalized SQL query returning multiple rows as the first mapping choice.
9. When a preserved region is a cluster of nearby entity, media, or navigation cards, emit one grouped native `cards` region with one SQL query returning multiple rows as the first mapping choice.
10. Split that cluster into separate peer regions only when the screenshot clearly shows distinct containers, headings, or spacing that make each metric or card its own region.
11. When a preserved region is clearly a vertical task or navigation panel, create a shared list with the visible entries and emit a `list` region that references it.
12. When a preserved region is clearly a search or filter form, emit real page items for the visible controls and real buttons for the visible actions inside one shared form/layout container.
13. If no primitive region matches safely, keep it in the same layout position as a `staticContent` region with short descriptive placeholder text only.
14. Do not use `source.htmlCode`, custom markup, or decorative static content to mimic cards, reports, charts, forms, or other screenshot regions.
15. If the target app already uses shared navigation or breadcrumbs, add one navigation-menu entry and one breadcrumb entry for the new page by reusing the existing shared-component ids, entry containers, and target format already present in the app.
16. Emit the page draft and any required shared-component updates so the new page matches the screenshot layout and integrates cleanly with the target app.

## Layout Priorities
1. Preserve exact region structure.
2. Preserve exact ordering, grouping, and nesting.
3. Preserve approximate component choice without changing the layout tree.
4. Treat styling as last.

## Clarification Gate
- Ask one short follow-up only when a blocking ambiguity changes:
  - the destination page identity
  - a major region type
  - a clearly visible label or action that appears central to the page
- If the page is still ambiguous after that round, stop with `Missing Inputs`.

## Guardrails
- Do not use HTML code, HTML regions, `source.htmlCode`, or HTML-like static markup to mimic screenshot fragments.
- Do not use `staticContent` as a visual recreation tool; use it only as a descriptive placeholder shell when no native APEX primitive region is a safe match.
- Do not use fake widget markup or decorative text blocks to imitate cards, reports, charts, form controls, or other primitive regions.
- Do not invent business logic or SQL.
- Do not collapse multiple top-level screenshot rows into one generic page stack or one oversized synthetic wrapper region.
- Do not turn a clear sidebar/main composition into sequential full-width regions.
- Do not implement an anchored right rail as one top-level sidebar wrapper with nested child regions when the screenshot shows separate framed sidebar panels.
- Do not let a lower two-up summary row stretch to the full page width when the screenshot keeps it within the main workspace footprint.
- When several visible regions belong to the same vertical lane, prefer one invisible outer lane region instead of repeated spacing hacks or ad hoc wrappers.
- When a parent lane contains recurring inner columns, prefer nested structural placeholder regions instead of re-solving those child columns independently in each row.
- Do not assume the layout can only be expressed with `LEFT` and `RIGHT`; add as many structural placeholder regions as the screenshot topology requires.
- Use structural placeholder regions to preserve stable outer and inner column boundaries, not as an afterthought once component mapping has already started.
- Do not silently drop, merge, or reorder visible sections after the layout tree is derived.
- Do not split one visually grouped KPI strip into multiple regions or one static region per metric unless the screenshot clearly shows separate region containers.
- For KPI strips, grouped `themeTemplateComponent/metricCard` is the expected default mapping. Use native Cards only when the user explicitly asks for Cards/native cards or when the visible content is an entity/media/navigation card grid.
- Do not render obvious `Actions`, `Links`, `Resources`, or `Quick Links` panels as static text when native shared lists plus list regions are a safe mapping.
- Do not render obvious form controls or action buttons as static text when real page items and real buttons are a safe native mapping.
- Placeholder static regions must include short descriptive placeholder text only in the region body.
- Do not route into import or runtime workflows from this package by default.
- Do not create a new page draft without also updating the app's shared navigation or breadcrumb definitions when those patterns already exist in the target app.
