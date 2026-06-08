# APEX Application Specification Template

Use this template when building a complete APEX application from functional requirements plus an authoritative model or schema metadata. The template is a planning artifact that must be completed before generating non-trivial application artifacts.

## Summary

- Application purpose:
- Target users:
- Primary workflows:
- Authoritative sources:
- Target app path:
- Runtime mode: offline planning | live DB check later

## Source Evidence

- Functional requirements:
- Model/schema metadata:
- Existing app context:
- DB object evidence source: schema_doc | live_db | user_asserted | unresolved
- Unresolved structural facts:

## Page Inventory

| Page | Name | Type / APEX Pattern | Modal | Data Source | Navigation / Launch Path | Primary Actions |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |

For every page, include:
- regions in visual order
- native component family for each region
- form presentation for form/detail pages: standard modal dialog, drawer start/end/top/bottom, wizard modal dialog, or normal non-modal page
- layout row recipe
- source table/view/query intent
- buttons, links, row actions, and modal targets
- parent-child context items and refresh dependencies
- template family or construction pack needed before generation
- compiler-truth questions that must be resolved before drafting

## Application Composition Plan

- Application scope:
- Artifact scope:
- Page groups:
- Shared LOVs:
- Navigation menu:
- Management or launch hub entries:
  - Include `page`, `label`, `targetPage`, `icon`, and `description` for every launcher entry.
  - Use conservative Font APEX `fa-*` icons, for example `fa-package`, `fa-image`, `fa-filter`, `fa-users`, `fa-map-marker`, `fa-table`, or `fa-sitemap`.
- Breadcrumb hierarchy:
  - For every non-modal user page, list `page`, `entry`, and either `root: true`, `parentEntry`, or `parentPage`.
  - Parent hub-launched pages to the hub breadcrumb entry; parent contextual/detail pages to the launch/context page breadcrumb entry.
  - Emit parent links in `shared-components/breadcrumbs.apx` as `appearance { parentEntry: @entry }`.
- Modal pages and return behavior:
- Form behavior:
  - For every requirement-driven validation, list `page`, target `item`, validation type, message, and controlling `requiredWhen` item/value when conditional.
  - For context-owned items populated from launch mappings, list `page`, `item`, `contextOwned: true`, expected visibility, source page/region, and source key column.
  - For defaulting behavior, list `page`, target item, source item, lookup/source column, override policy, and triggering event.
- Parent-child relationships:
- Cross-page links:
- Map marker targets:
  - For each map marker edit/open behavior, list `page`, `sourceRegion`, `sourceLayer`, `targetPage`, `keyColumn`, and target item mappings.
  - For each multi-marker map, list the initial viewport strategy. Prefer `viewport: boundingBox` with min/max latitude and longitude evidence; fixed center/zoom requires explicit one-geography requirements evidence.
  - Map child layers in master-detail pages must use normal `:P...` binds plus explicit child-region refresh behavior; do not use session-state reads or require map-layer `source.pageItemsToSubmit` unless direct compiler truth for the active build proves it valid for the selected layer shape.
- Page-level actions:
  - For each page-level create/action button, list `page`, `label`, `targetPage`, item mappings, and `placement`.
  - If the page has a breadcrumb/title-bar region, primary page-level create actions belong in the breadcrumb/title-bar (`placement: breadcrumb`) unless a specific template says otherwise.
- Refresh dependencies:
- Static files/icons:
- Plan-to-artifact traceability:

## App UX Contract

Create project-root `.apexlang/app-ux-contract.json` before drafting non-trivial `.apx` artifacts. This JSON is the validator-facing traceability contract for full-app generation. Keep this template's completed `application-spec.md` beside that contract in project-root `.apexlang/`; do not place planning/run artifacts inside `applications/<app>/` or app-local `.apex/`.

Required top-level sections:
- `sourceEvidence`
- `pageInventory`
- `compositionPlan`
- `richUiPatternPlan`
- `lovPlan`
- `behaviorPlan`
- `testPlan`

Each generated user page must have a `pageInventory` entry with `page`, `name`, `type`, and either `requirementId` or `derivedWorkflowId`. Declare only UX patterns, display mappings, links, modal targets, page actions, refresh dependencies, LOVs, layout recipes, and accessibility/guidance requirements that are supported by requirements, model/schema metadata, or explicit user assertion.

`compositionPlan.breadcrumbs` must be a non-flat object array. Each entry requires `page` and `entry`; root pages must declare `root: true`, and child/context pages must declare `parentEntry` or `parentPage`. When `compositionPlan.managementHubPages` exists, those pages must be breadcrumb children of the resolved management hub page.

Breadcrumb/title-bar regions must not display generic chrome labels such as `Breadcrumb` or `Title Bar`; use the current breadcrumb entry/page title as the visible region name, keep the title-bar/breadcrumb templates, and use live-valid template options such as standalone `#DEFAULT#`.

`behaviorPlan.modalTargets` or `compositionPlan.modalTargets` must include every report/form launch from the requirements, including parent edit actions, child create actions, child edit links, map marker edit/open links, and drilldowns. `behaviorPlan.pageActions` or `compositionPlan.pageActions` must include page-level create/action buttons and their placement, especially breadcrumb/title-bar placement for primary page actions.

Every `behaviorPlan.parentChildContext` entry must include `actionCoverage` for required parent edit, child create, child edit/detail, and page-level create behaviors. Each action entry needs source region or column, target page, target item mappings, key column, and placement; explicitly record exclusions when a normally expected master-detail action is out of scope.

`behaviorPlan.validations`, `behaviorPlan.formContext`, and `behaviorPlan.formDefaults` must cover every form requirement that controls requiredness, visibility/editability, context prepopulation, or defaulted values. The local validator treats these as fail-closed contract entries: if the contract declares them, matching generated `.apx` behavior must be present before import eligibility.

`compositionPlan.managementHubEntries` should include `icon` and `description` for each media-list launcher. Shared list entries for hub targets must emit `icon { imageIconCssClasses: fa-* }` and `userDefinedAttributes { 1: ... }`.

Faceted-search facet plans must distinguish runtime facet data types from SQL/report metadata. Date/time facets use `source.dataType: date`, numeric facets use `source.dataType: number`, and string facets omit `source.dataType` instead of using `varchar2` or `VARCHAR2`.

Faceted-search checkbox/radio facet plans must include value-list controls: default `maxDisplayedEntries` to `10`, keep justified values between `5` and `15`, and set `displayFilterInitially: true` for high-cardinality Product, Customer, Store, Assignee, Owner, User, Employee, Supplier, Email, SKU, name, or title facets.

## Rich UI Pattern Plan

Use native APEX components first. Include only patterns supported by requirements and model evidence.

- Dashboard: KPIs, charts, cards, contextual summaries, filter controls.
- Dashboard KPI details: for every KPI/metric/count/total/revenue/average requirement, record `metricCard` intent with title, icon, value source, optional meta text, and normalized multi-row grouping; Classic Report is not an acceptable implementation for single-value KPI tiles.
- Workbench/master-detail: parent selector, protected context item, child regions.
- Reports: interactive report, classic report, interactive grid, row links.
- Forms: modal/non-modal form, Auto Row DML, validations, delete behavior.
- Form presentation defaults: use drawer end/right for report row edit/create flows unless the requirements explicitly call for standard modal dialog, drawer start/top/bottom, wizard, popout-style dialog, or full-page detail behavior.
- Drawer selection: use drawer end for right-side side-sheet edit tasks by default; use drawer start/top/bottom only when requirements or target device/workflow intent specify that position.
- Drawer emission: generated drawer pages must include the explicit end/right drawer template option, not only `templateOptions: #DEFAULT#`.
- Cards/gallery: entity cards, media/image mapping, card actions.
- Calendar: date column, display value, create/edit targets.
- Map: latitude/longitude columns, layer source, tooltip/info columns.
- Smart/Faceted filters: filter columns, target region, result region.
- Hub/navigation: list entries, descriptions, icons, launch targets.

## LOVs

### Static LOVs

| LOV | Values | Evidence |
| --- | --- | --- |

### Dynamic LOVs

| LOV | Display | Return | Source Object | Evidence |
| --- | --- | --- | --- | --- |

## Data, Validation, And Behavior

- Required fields:
- Optional fields:
- Conditional validations:
- Context-owned hidden/display-only items:
- Defaulted items and override policy:
- Foreign keys:
- Check constraints:
- Date/time handling:
- Derived metrics and totals:
- Delete restrictions:
- Report-to-form behavior:
- Modal return behavior:
- Security and authorization assumptions:

## Generation Readiness

- Required canonical templates or construction packs:
- Required compiler-truth queries:
- Required local validation:
- Required live validation, if any:
- Import eligibility blockers:

## Test Plan

- Page inventory coverage:
- Navigation and launch paths:
- Dashboard and analytics:
- Report links and modal forms:
- LOV correctness:
- Validation and constraints:
- Runtime validation:

## Assumptions

- Low-risk assumptions only:

## Missing Inputs / Blockers

- Planning blockers:
- Generation blockers:
- Live validation/import blockers:
