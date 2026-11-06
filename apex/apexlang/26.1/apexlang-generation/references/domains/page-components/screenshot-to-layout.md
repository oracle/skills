---
name: screenshot-to-layout
description: Turn a desktop enterprise UI screenshot or mockup into an Oracle APEX page draft by deriving the exact region layout first. Use when Codex must inspect a local image file, match region topology, ordering, nesting, and width intent as closely as possible, then map each preserved region to native APEX primitive regions only, with plain-text placeholder `staticContent` only when no primitive region is a safe match.
---

# Reference Package — Screenshot to Layout

**Parent Entries:** `references/domains/README.md` (domain), `SKILL.md` (router)

This package converts a screenshot-driven page concept into one APEXlang page draft staged under a transient app copy. Its primary output is an exact region layout plan: derive the full region structure first, preserve that structure in the emitted page, and only then choose the nearest native APEX primitive region for each region, such as cards, reports, charts, lists, form regions, page items, and buttons. If a region cannot be mapped confidently to a primitive region, preserve it as a `staticContent` region with brief placeholder text describing what belongs there.

## Use When
- The user has a local screenshot, wireframe, or mockup for a desktop enterprise page.
- The goal is to create one APEXlang page draft whose region layout, grouping, nesting, and reading order match the screenshot as closely as possible.
- The target app already exists under `applications/<target-app>/`, but working changes for this workflow must stay in a transient temp workspace outside the repo until the run passes review and runtime gates.

## Do Not Use When
- The request is general APEX page generation without an image; use `SKILL.md`.
- The request is specification work without page-generation intent.
- The screenshot is primarily mobile, marketing, or highly bespoke brochure-style design.
- The user wants pixel-perfect theming, direct runtime import, or markup-based recreation of screenshot fragments.

## Required Inputs
- `image_path`
- `app_path`
- `page_id`
- `page_title` or page slug

## Optional Inputs
- Notes for unreadable labels, intended actions, data-source hints, component preferences, or business context.

## Output Contract
- Generate exactly one APEXlang page update in the transient temp workspace, then publish it to `applications/<target-app>/pages/p<PageId>-<slug>.apx` only after the run passes review and any requested runtime gates.
- When the target app already uses shared navigation and breadcrumbs, update the app's navigation menu list and breadcrumb shared components using the target app's existing identifiers and entry format as concrete integration facts only.
- Derive the complete region layout tree before choosing component types.
- Determine the page's structural lane tree before detailed region mapping:
  - top-level rows
  - outer lanes or columns
  - nested child lanes inside any parent lane that reuses inner columns
- Derive and preserve the screenshot's top-level page row plan before introducing nested regions or choosing components.
- Keep region topology, order, nesting, and width/span intent intact while mapping regions to native APEX primitive regions.
- Primitive-first mapping is mandatory: try cards, reports, charts, lists, form regions, page items, buttons, and other native APEX primitives before considering `staticContent`.
- If a region does not map confidently to a primitive region, preserve it as a `staticContent` region with brief placeholder text describing the expected content or behavior.
- Do not perform the live APEXlang check, SQLcl roundtrip, or import by default.
- Do not generate non-page artifacts from this package.

## Authoritative Reuse
- Parent APEX generation context: `SKILL.md`
- Page-composition domain context: `references/domains/README.md`
- Layout rules: `references/policies/memory-bank/30-pages/apex.layout.md`
- Template defaults: `references/policies/memory-bank/40-components/apex.templates.md`
- Use existing APEXlang templates under `templates/`

## Router Contract
- Router: true
- Kind: one-message
- TargetWorkflow: `references/domains/page-components/screenshot-to-layout.md`
- Match keywords:
  - `screenshot`
  - `mockup`
  - `wireframe`
  - `image to apex`
  - `screenshot to layout`
  - `render page from image`
- Defaults:
  - `image_path: ""`
  - `app_path: ""`
  - `page_id: ""`
  - `page_title: ""`
  - `notes: ""`
  - `prompt_normalization: enabled`
  - `clarification_rounds_max: 1`
  - `clarification_style: simple_english`
  - `ambiguity_policy: ask_then_stop`

## Operating Rules
- Accept free-form prompts by default and normalize them before determining whether required inputs are present.
- Load only the minimum screenshot-specific guidance first:
  - `references/domains/page-components/screenshot-to-layout.md`
  - `references/domains/page-components/screenshot-to-layout/workflow.md`
  - `references/domains/page-components/screenshot-to-layout/component-mapping.md`
- Load `SKILL.md` only as the parent generation context for the emitted page format.
- Load `references/policies/memory-bank/30-pages/apex.layout.md` and `references/policies/memory-bank/40-components/apex.templates.md` before assigning any region types.
- Inspect the target app's existing shared navigation and breadcrumb files before drafting the page so any new page entry can reuse the app's concrete shared-component identifiers, entry containers, and target references without using the app as a pattern source.
- For page-scoped screenshot generation, use `templates/page-examples/**` as the page-pattern source before consulting narrower region families.
- Commit to a structure-first planning pass before component mapping:
  - top-level BODY row plan
  - page-wide outer lane or column structure
  - nested child lane structure inside any parent lane that reuses inner columns
  - frozen structural scaffold before visible component mapping
- Derive the region layout tree first: top-level rows, sibling membership, outer lane ordering, nested lane ownership, and width intent.
- Treat structural placeholder regions as the default alignment tool whenever stable outer or inner columns repeat across rows or within a parent lane.
- Keep screenshot rows at the same hierarchy level whenever the screenshot shows them as peer page rows; do not wrap dissimilar rows in a synthetic container just because generation becomes easier.
- When a screenshot depends on stable page-wide columns or lanes, preserve those columns first with shared structural placeholder regions instead of rebuilding the same alignment row-by-row.
- When the screenshot shows a dominant left workspace with a stacked right rail of individually framed panels, keep those right-rail panels as repeated top-level BODY peers anchored to the same right-side columns.
- When a lower summary row visually belongs under that dominant left workspace, keep its combined width constrained to the same left-workspace footprint instead of letting it expand underneath the right rail.
- When multiple visible regions stack within the same column or lane, prefer one minimal outer layout region for that lane and place the visible regions inside it as children.
- Support one, two, three, or more outer lanes whenever the screenshot topology requires them.
- Support nested structural child lanes inside parent lanes whenever a parent lane contains its own repeated inner columns.
- Do not let component substitution collapse, merge, reorder, resize, or omit screenshot regions once the layout tree is established.
- Treat component mapping as a second-phase decision that chooses a region type only after the layout is fixed.
- Treat component mapping as a primitive-first decision: use native APEX primitive regions only to represent screenshot regions whenever a safe match exists.
- When several nearby aggregate metrics clearly belong to one visual KPI strip, treat that strip as one preserved region and map it to a single `themeTemplateComponent/metricCard` region backed by one normalized SQL query unless the user explicitly specifies native Cards.
- When several nearby entity, media, or navigation cards clearly belong to one grouped block, treat that block as one preserved region and map it to a single native `cards` region backed by one SQL query before considering any one-region-per-card fallback.
- Do not emit one region per metric for KPI strips unless the screenshot clearly shows separate region containers with meaningful spacing, framing, or headings between metrics.
- When a utility panel is primarily a vertical set of navigational or task links labeled with headings such as `Actions`, `Links`, `Resources`, or `Quick Links`, first map it to a shared list plus a `list` region rather than a `staticContent` region.
- When a screenshot is primarily a search or filter form, prefer real page items and real buttons over `staticContent` placeholders for the visible controls and actions.
- When several controls clearly belong to one cohesive form block, keep them inside one shared form or structural layout container instead of fragmenting them into unrelated peer regions.
- When a page reads as centered hero + feature strip + form + action row, preserve that row order explicitly.
- Use `staticContent` only as a plain-text placeholder shell when no native APEX primitive region is a safe fit; do not use it to simulate cards, reports, charts, forms, or other primitives.
- Ask at most one short clarification round when a blocking ambiguity materially changes the destination page or a major region mapping.
- If ambiguity remains after that round, stop with `Missing Inputs`.
- When creating a new page draft, do not leave it orphaned from shared navigation. Add the matching navigation-menu entry and breadcrumb entry unless the target app clearly does not use those shared components.
- Keep this package focused on structure-first page composition. Resolve template, grid, lane, and template-option decisions through `references/policies/memory-bank/40-components/apex.templates.md`; do not broaden the workflow into non-structural skinning.

## Safety Directive
- Err on the side of caution when the screenshot is ambiguous.
- Region layout accuracy outranks component fidelity and styling fidelity.
- Prefer native APEX primitive regions over custom recreation, but only after the screenshot region layout has been preserved.
- Page-level layout fidelity outranks local component convenience. Do not flatten a multi-row screenshot into a generic vertical stack of regions.
- If a section is clearly present but the exact component type is uncertain, keep the region in place as a `staticContent` region and add brief placeholder text describing the intended content or behavior.
- Do not use `source.htmlCode`, HTML regions, HTML-like static markup, or decorative markup to imitate screenshot widgets or region chrome.
- Do not use `staticContent` to visually recreate cards, reports, charts, forms, timelines, or composite widgets; use native APEX primitive regions for those whenever a safe mapping exists.
- Prefer under-specifying behavior over inventing SQL, LOVs, validations, processes, unsupported controls, or fake interactivity.
- Never drop a visible screenshot region because it lacks a confident APEX component mapping.
- Do not over-fragment nearby metrics into multiple regions or multiple static regions when the screenshot shows them as one grouped KPI strip.
- For KPI strips, a grouped Metric Card region is the default mapping, not an optional enhancement. Use native Cards only when the user explicitly asks for Cards/native cards or when the visible content is an entity/media/navigation card grid.
- Do not leave obvious navigational link panels as raw static text when a native shared list plus list region is a plausible mapping.
- Do not invent synthetic parent regions for whole page sections unless the screenshot clearly shows a framed parent container around those child regions.
- Do not solve an anchored side rail as `main region + sidebar wrapper with nested children` when the screenshot shows individually framed right-rail cards.
- Do not let subordinate lower rows spill to full-page width when the screenshot shows them constrained under the main workspace beside an empty or shorter right rail.
- A minimal invisible layout container is allowed only when it is needed to preserve a constrained sub-row width such as “two panels inside the main 9-column workspace,” and the screenshot does not require that container to render visible chrome.
- Outer and inner lane regions are placeholders only: always use `appearance.template: @/blank-with-attributes`, do not rely on them to render visible UI chrome, and keep their names structural rather than user-facing.
- Placeholder-region naming is intentionally flexible. `LEFT`, `CENTER`, `RIGHT`, `MAIN`, `RAIL`, `TOP_LEFT`, `BOTTOM_RIGHT`, and similar names are examples only; use as many structural placeholder regions as the screenshot topology requires.
- Structural placeholder regions should be preferred whenever they preserve recurring alignment more cleanly than repeated explicit placement, but do not introduce wrappers that do not correspond to real alignment needs in the screenshot.
- Do not leave obvious form controls or action buttons as static prose when the screenshot clearly indicates interactive fields and actions.

## Generation Algorithm
1. Read the screenshot and identify every visible region, grouping, heading, control cluster, action area, and reading-order transition.
2. Write the top-level BODY row plan explicitly in working memory before choosing region types:
   - row 1 siblings
   - row 2 siblings
   - row 3 siblings
   - any asymmetric split ratios
3. Determine the page's structural lane tree before mapping visible regions:
   - outer lanes or columns that persist across the page
   - any parent lane that owns nested child lanes or sub-columns
   - which visible regions belong directly to an outer lane versus a nested child lane
   - where shared structural placeholder regions are required to preserve stable alignment
4. Freeze the structural scaffold before choosing region types:
   - outer lane placeholders first
   - nested child lane placeholders second
   - visible descendant regions only after the lane tree is fixed
5. Choose row recipes from `references/policies/memory-bank/30-pages/apex.layout.md` to preserve the derived layout as closely as possible.
   - keep equal-width rows implicit
   - keep asymmetric rows as same-row siblings with explicit spans only where needed
   - for anchored side rails, repeat explicit right-side placement on each top-level peer region instead of nesting them in a wrapper
   - if a lower summary row must stay within the main workspace width, constrain that row to the same width budget before placing its child panels
   - when a whole vertical lane contains several stacked regions, use one outer structural placeholder region for that lane
   - when a parent lane contains recurring inner columns, use nested structural placeholder regions for those child lanes
   - keep lower summary rows separate from the main workspace row when the screenshot does
6. Map each preserved visible region to the closest native APEX primitive region using `references/domains/page-components/screenshot-to-layout/component-mapping.md`.
7. When a preserved region contains several nearby aggregate metrics that read as one grouped KPI strip, emit one `themeTemplateComponent/metricCard` region with one normalized SQL query returning multiple rows as the default outcome.
8. When a preserved region contains several nearby entity, media, or navigation cards, emit one native `cards` region with one SQL query returning multiple rows as the default outcome.
9. Only split a grouped KPI strip or card block into multiple peer regions when the screenshot clearly indicates each metric or card is its own region through separate framing, spacing, or headings.
10. When a preserved region is clearly a task or navigation link panel, create a shared list with the visible entries and map the region to a native `list` region before considering `staticContent`.
11. When a preserved region is clearly a search or filter form, emit real page items for the visible controls and real buttons for the visible actions before considering `staticContent`.
12. If no native APEX primitive region maps confidently, keep the region in the same place and emit it as `staticContent` with brief placeholder text such as "Placeholder for shipment status timeline."
13. Do not use HTML, custom markup, or styled static content to mimic the original screenshot region when falling back to `staticContent`.
14. Generate visible labels and buttons only after the structural scaffold and visible region placement are settled.
15. Inspect the target app's shared breadcrumb and navigation menu definitions and add one entry for the new page by reusing the existing shared-component containers and concrete target format already present in that app.
16. Do not invent SQL, item validations, process logic, dynamic actions, or shared-component dependencies unless the user supplied them in notes, except for the shared navigation and breadcrumb entries required to integrate the new page into an app that already uses them.

## Acceptance Checklist
- Exactly one page draft path is resolved.
- When the target app uses shared navigation or breadcrumbs, the draft includes matching updates to those shared components so the page is reachable and integrated without using the app as a pattern corpus.
- The page preserves the screenshot's region topology, ordering, grouping, nesting, and width intent as closely as possible within native APEX layout rules.
- The page preserves the screenshot's top-level row count and sibling grouping instead of collapsing multiple rows into a simpler stack.
- Lane-tree extraction happens before component mapping.
- Equal-width rows use implicit flow; explicit coordinates appear only for intentionally asymmetric layouts.
- Sidebar/main layouts remain same-row siblings with asymmetric spans when the screenshot shows a side rail.
- Anchored right-rail panels remain top-level BODY peers rather than children of a synthetic sidebar wrapper.
- Lower summary rows that sit under the main workspace stay within that same width budget instead of stretching beneath the right rail.
- Outer lane regions used to group stacked columns are structural placeholders only and always use `@/blank-with-attributes`.
- Nested child lane regions use the same structural-placeholder contract when a parent lane contains recurring inner columns.
- The pattern supports more than just `LEFT` and `RIGHT`; use as many structural placeholder regions as the screenshot layout needs.
- Stable outer columns and stable inner child columns are preserved with shared structural parents rather than recomputed row by row.
- Nearby aggregate metrics that visually belong together are emitted as one Metric Card region with one normalized SQL source unless the screenshot clearly separates them into distinct regions.
- A screenshot metric strip must not degrade into one staticContent region per metric when a grouped Metric Card region is a plausible native APEX mapping.
- Visible utility panels made of actionable or navigational links prefer shared lists plus `list` regions over `staticContent`.
- Screenshot-derived search or filter pages use real page items and real buttons for obvious controls and actions.
- Centered hero + feature strip + form + action row compositions preserve that row order explicitly.
- Dissimilar sections that appear as separate screenshot rows are not hidden inside one synthetic parent region unless the screenshot shows a shared parent frame.
- Unmappable or uncertain regions remain in place as `staticContent` regions with brief descriptive placeholder text only.
- No screenshot region is recreated with HTML, HTML-like markup, or decorative static markup.
- No HTML fallback is used.
- No screenshot regions are dropped, merged away, or reordered because of component limitations.
- The package asks at most one clarification round.
- The run stops before validate/import/runtime work unless the user explicitly switches workflows.

## Example Triggers
- "Use `screenshot-to-layout` to turn `/tmp/customer-search.png` into page 12 in `applications/layout`."
- "Create an APEX page from this wireframe screenshot, matching the region layout precisely before choosing components."
- "Render this mockup into an APEXlang page draft, preserving every screenshot region and using descriptive static regions where the widget type is unclear."
