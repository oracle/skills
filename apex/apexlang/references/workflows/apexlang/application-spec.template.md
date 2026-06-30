# APEX Application Specification Template

Use this template when building a complete APEX application from functional requirements plus authoritative model or schema metadata. Complete it before generating non-trivial `.apx` artifacts.

The spec is a deterministic planning contract, not a prose summary. Its job is to prove requirement coverage, freeze implementation decisions, and make `.apexlang/app-ux-contract.json` mirror those decisions before page drafting starts.

## Spec Completion Protocol

Complete these steps in order.

1. Parse the functional requirements, model/schema metadata, roles, page intents, workflows, actions, validations, LOVs, KPIs, charts, maps, calendars, reports, and explicit exclusions.
2. Assign stable requirement IDs. Preserve source IDs when present; otherwise synthesize `FR-001`, `FR-002`, and so on in source order. For required generated workflows not directly named by requirements, synthesize `DW-001`, `DW-002`, and so on with evidence and reason.
3. Freeze one `Frozen Application Plan` and one `Frozen Region Plan`. Do not re-decide page, region, source, action, navigation, breadcrumb, LOV, or layout choices while drafting artifacts.
4. Build the `Requirement Coverage Matrix` and `Source Evidence Matrix`.
5. Fill `Application Composition Plan`, `Behavior Coverage`, `Rich UI Pattern Plan`, `LOVs`, and `Test Plan` only from the frozen plans.
6. Write project-root `.apexlang/app-ux-contract.json` from this spec and complete the `Contract Mirror Checklist`.
7. Stop with `Missing Inputs` when required objects, columns, relationships, target pages, target items, UX mappings, or compiler-truth decisions remain unresolved.
8. Draft `.apx` artifacts only after the spec and app UX contract are complete.

## Completion Rules

- Every required section must be populated or explicitly marked `none` with a reason.
- Blank placeholder rows must not remain in a completed spec.
- `unresolved` entries are allowed only in `Missing Inputs / Blockers`; unresolved required structure blocks generation.
- Later sections must reference or elaborate frozen-plan rows. They must not introduce new pages, regions, source shapes, actions, modal targets, LOVs, breadcrumbs, layouts, or rich UI patterns.
- If a repair changes a page, region, source, action, LOV, breadcrumb, layout, or pattern decision, update the frozen plans first, then mirror that repair through the rest of this spec and `.apexlang/app-ux-contract.json`.

## Summary

- Application purpose:
- Target users:
- Primary workflows:
- Authoritative sources:
- Target app path:
- Runtime mode: offline planning | live DB check later
- Destination APEX workspace, when required:
- Known exclusions:

## Requirement Coverage Matrix

Every bounded functional requirement must map to a frozen plan entry. Include pages, regions/reports, filters, actions, KPIs, charts, forms, validations, LOVs, navigation entries, acceptance criteria, and explicit exclusions.

| Requirement ID | Requirement Text / Cue | Planned Page / Region / Action | Frozen Plan Reference | Status: covered / unresolved / excluded | Evidence |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Rules:
- Preserve source requirement IDs when available. If missing, synthesize stable `FR-001`, `FR-002`, and following IDs in source order.
- For generated support workflows not directly named by FRs, synthesize `DW-001`, `DW-002`, and following IDs. Include evidence and reason.
- Preserve explicit FR order for pages, regions, fields, filters, actions, KPIs, and navigation entries.
- If a requirement is intentionally excluded, record the exclusion and evidence.
- Do not satisfy a requirement with a generic helper region when the requirement calls for a specific page, action, validation, or workflow.

## Source Evidence Matrix

Use model/schema metadata as the authority for database structure. Use requirements as the authority for business behavior and UX intent.

| Fact Type | Object / Column / Relationship / Behavior | Evidence Source: schema_doc / live_db / user_asserted / unresolved | Evidence Detail | Status | Notes / Conflict |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Required evidence:
- Every referenced table, view, package, function, and column.
- Primary keys, foreign keys, self-foreign keys, nullability, check constraints, and semantic columns such as amount, status, image, date, latitude, longitude, owner, assignee, or title.
- Every SQL-bearing page, region, LOV, validation, process, and query fragment.
- Every target page, target item, source key column, and modal launch mapping.

Stop conditions:
- Same-rank sources conflict on structural facts.
- A required DB object, column, relationship, page, item, or compiler-truth decision remains `unresolved`.
- A requested rich UI pattern lacks model/schema or explicit requirement evidence.

## Deterministic Planning Rules

- FR order wins for explicitly requested pages, regions, fields, filters, actions, KPIs, and navigation entries.
- Schema order wins for columns when FR is silent.
- Generated support pages go immediately after their owning page; drill/detail pages go immediately after their source page.
- Hub or launcher pages follow the pages they launch unless FR explicitly orders the hub first.
- When no explicit FR order exists, page purpose order is: dashboard, hub, report/search, workbench/master-detail, detail, create/edit form, calendar, map, administration/support.
- Final fallback order is source entity/schema order, then page purpose order, then lexical canonical page name.
- Add only required support pages, helper regions, summaries, context regions, and launch hubs. Plausible but optional UI is out of scope.
- Simple single-object Classic Report, Interactive Report, Cards, and Content Row pages default to table/view sources.
- Use SQL only for joins, aggregation, computed columns, BLOB projection rules, contextual info, filtered bind predicates, maps, calendars, parent-child context, or explicit requirement behavior.
- Once frozen, repair only to make the selected plan valid; do not replace it with an equivalent alternative.

## Canonical Frozen Plans

`Frozen Application Plan` and `Frozen Region Plan` are the canonical decision source. All later sections are mirrors or details of these plans.

- Do not add pages, regions, source shapes, actions, modal targets, LOVs, breadcrumbs, layout recipes, or rich UI patterns later unless the item already exists in a frozen plan row.
- Do not rename or reorder frozen pages, regions, actions, LOVs, breadcrumbs, or source shapes while filling later sections.
- Do not use the app UX contract as a second planning pass. It mirrors the frozen plans and behavior tables.
- Repairs must update frozen plans first, then all dependent mirror sections.

## Frozen Application Plan

This is the single source of truth for page identity, order, grouping, navigation, breadcrumbs, and high-level pattern decisions.

| Page | Name | Group | Type / Native Pattern | Page Mode | Menu | Breadcrumb Entry | Requirement ID / Derived Workflow ID | Primary Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |

For every page, record:
- Why this page exists.
- Whether it is user-facing, modal/dialog, login/global, or support-only.
- Form presentation for form/detail pages: standard modal dialog, drawer start/end/top/bottom, wizard modal dialog, or normal non-modal page.
- Template family or construction pack required before generation.
- Compiler-truth questions that must be resolved before drafting.

## Frozen Region Plan

This is the single source of truth for page-local visual order, source shape, layout, columns, filters, actions, and refresh behavior.

| Page | Order | Region Name | Native Component Family | Parent/Child Role | Source Shape: table / view / sql / none/staticContent | Source Object / Query Intent | Layout Recipe | Columns / Display Mappings | Links / Actions | Filters | Refresh / Context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |  |  |  |

Rules:
- Rendered region count and order must match this frozen region plan.
- Region names must be frozen and reused exactly in breadcrumbs, links, refresh dependencies, comments, and app UX contract references.
- Source shape must be exactly `table`, `view`, `sql`, or `none/staticContent`.
- Use `none/staticContent` only for non-data static content. It is not a database source substitute and must not be used for reports, charts, forms, maps, calendars, LOVs, or data-driven cards.
- Column order is: primary keys, required display columns, title/name columns, foreign key display columns, filter/order/link/BLOB companion columns, remaining FR-visible columns in schema order, hidden technical columns last.
- Parent-child pages use one parent context region and one or more child regions. Parent selection updates same-page context items and refreshes child regions; do not implement primary parent selection by redirecting back to the same page.
- Faceted Search and Smart Filters target only supported result regions; filtered columns must exist in the target columns or SQL select list.

## Application Composition Plan

- Application scope:
- Artifact scope:
- Page groups:
- Shared LOVs:
- Navigation menu:
- Static files/icons:
- Plan-to-artifact traceability:

### Management Or Launch Hub Entries

| Page | Label | Target Page | Icon | Description | Evidence |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Use conservative Font APEX `fa-*` icons, for example `fa-package`, `fa-image`, `fa-filter`, `fa-users`, `fa-map-marker`, `fa-table`, or `fa-sitemap`.

### Breadcrumb Hierarchy

| Page | Entry | Root | Parent Entry | Parent Page | Evidence |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Rules:
- Every non-modal user page needs one breadcrumb entry and one visible breadcrumb/title-bar region wired to `@breadcrumb`.
- Modal/dialog pages, page 0, login pages, and global pages are exempt.
- Parent hub-launched pages to the hub breadcrumb entry.
- Parent contextual/detail pages to the launch/context page breadcrumb entry.
- Emit parent links in `shared-components/breadcrumbs.apx` as `appearance { parentEntry: @entry }`.
- Breadcrumb/title-bar regions must not display generic chrome labels such as `Breadcrumb` or `Title Bar`; use the current breadcrumb entry or page title.

## Behavior Coverage

### Modal Targets And Cross-Page Links

| Source Page | Source Region / Column / Action | Target Page | Target Items | Key Column | Presentation | Close Refresh Region | Requirement ID |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |

Include every report/form launch from requirements: parent edit actions, child create actions, child edit links, page buttons, map marker edit/open links, card actions, calendar links, and drilldowns.

### Page-Level Actions

| Page | Label | Target Page | Item Mappings | Placement | Requirement ID |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

If the page has a breadcrumb/title-bar region, primary page-level create actions belong in the breadcrumb/title-bar with `placement: breadcrumb` unless a specific template says otherwise.

### Parent-Child Context And Action Coverage

| Page | Parent Region | Context Item | Source Key Column | Child Regions | Action Coverage | Exclusions |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |

Each action coverage entry needs source region or column, target page, target item mappings, key column, placement, and requirement evidence. Explicitly record exclusions when a normally expected master-detail action is out of scope.

### Form Validations, Context, And Defaults

| Page | Item | Behavior Type: validation / context / default | Message / Source | Required When / Trigger | Editable / Visible | Requirement ID |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |

Cover every form requirement that controls requiredness, visibility/editability, context prepopulation, defaulting, validation, delete behavior, or return behavior.

### Form Processes And Delete Rules

| Page | Form Region | Process Intent: Auto Row DML / custom process / none | Create | Update | Delete | Delete Restrictions | Requirement ID |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |

Use Auto Row DML for normal table-backed create/edit/delete forms unless requirements or schema constraints require a different process. Record delete restrictions from requirements, foreign keys, or security policy.

### Refresh Dependencies

| Event Source | Event | Affected Region / Item | Refresh / Set-Value Behavior | Requirement ID |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

Every report region that opens a modal page must have a close-refresh dependency using an `apexafterclosedialog` dynamic action that refreshes the originating report region.

### Security, Guidance, And Empty States

| Page / Region / Item | Coverage Type: authorization / help / accessibility / no-data | Planned Behavior / Text | Evidence | Requirement ID |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

Cover role-based authorization, security assumptions, concise help text, accessibility/guidance text, no-data messages, and empty-state behavior. If requirements define no roles, record the default authenticated-user assumption instead of inventing roles.

### Map Marker Targets And Viewport

| Page | Source Region | Source Layer | Target Page | Key Column | Target Item Mappings | Initial Viewport Strategy | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |

Rules:
- Prefer `viewport: boundingBox` with min/max latitude and longitude evidence for multi-marker maps.
- Fixed center/zoom requires explicit one-geography requirement evidence.
- Map child layers in master-detail pages use normal `:P...` binds plus explicit child-region refresh behavior.
- Do not use session-state reads or require map-layer `source.pageItemsToSubmit` unless direct compiler truth proves it valid for the selected layer shape.

## App UX Contract

Create project-root `.apexlang/app-ux-contract.json` before drafting non-trivial `.apx` artifacts. Keep the completed `.apexlang/application-spec.md` beside that contract. Do not place planning/run artifacts inside `applications/<app>/` or app-local `.apex/`.

Required top-level sections:
- `sourceEvidence`
- `pageInventory`
- `compositionPlan`
- `richUiPatternPlan`
- `lovPlan`
- `behaviorPlan`
- `testPlan`

### Contract Mirror Checklist

| Spec Section | App UX Contract Section | Complete | Notes |
| --- | --- | --- | --- |
| Requirement Coverage Matrix | `sourceEvidence.requirements` and `testPlan` |  |  |
| Source Evidence Matrix | `sourceEvidence` |  |  |
| Frozen Application Plan | `pageInventory` and `compositionPlan` |  |  |
| Frozen Region Plan | `pageInventory.regions`, `compositionPlan.layoutRecipes`, and `richUiPatternPlan` |  |  |
| Application Composition Plan | `compositionPlan` |  |  |
| Behavior Coverage | `behaviorPlan` and `compositionPlan` link/action arrays |  |  |
| Rich UI Pattern Plan | `richUiPatternPlan` |  |  |
| LOVs | `lovPlan` |  |  |
| Test Plan | `testPlan` |  |  |

### Mirror Discipline

- The app UX contract must mirror the frozen plans and behavior tables. It must not introduce new decisions.
- Contract completeness is checked against frozen plans, not free-form prose.
- If the app UX contract needs a page, region, action, LOV, breadcrumb, layout, pattern, or behavior absent from the frozen plans, repair the frozen plans first.
- If the frozen plans change, update the contract before drafting or revising `.apx` artifacts.

Contract rules:
- Each generated user page must have a `pageInventory` entry with `page`, `name`, `type`, and either `requirementId` or `derivedWorkflowId`.
- Declare only UX patterns, display mappings, links, modal targets, page actions, refresh dependencies, LOVs, layout recipes, and accessibility/guidance requirements that are supported by requirements, model/schema metadata, or explicit user assertion.
- `compositionPlan.breadcrumbs` must be a non-flat object array. Each entry requires `page` and `entry`; root pages declare `root: true`, and child/context pages declare `parentEntry` or `parentPage`.
- `behaviorPlan.modalTargets` or `compositionPlan.modalTargets` must include every report/form launch from the requirements.
- `behaviorPlan.pageActions` or `compositionPlan.pageActions` must include page-level create/action buttons and placement.
- Every `behaviorPlan.parentChildContext` entry must include `actionCoverage`.
- `behaviorPlan.validations`, `behaviorPlan.formContext`, and `behaviorPlan.formDefaults` must cover every requirement-driven form behavior.
- `compositionPlan.managementHubEntries` must include `icon` and `description` for each media-list launcher.
- Add `requiresAppUxContract: true` to app-local `.apex/apexlang.json` runtime metadata for full-app FR/model generation.

## Rich UI Pattern Plan

Use native APEX components first. Include only patterns supported by requirements and model evidence.

| Pattern | Page / Region | Native APEX Component | Evidence | Generation Notes |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

Pattern rules:
- Dashboard KPI details: for every KPI, metric, count, total, revenue, or average requirement, record `metricCard` intent with title, icon, value source, optional meta text, and normalized grouping. Classic Report is not an acceptable implementation for single-value KPI tiles.
- Form presentation defaults: use drawer end/right for report row edit/create flows unless requirements explicitly select standard modal dialog, drawer start/top/bottom, wizard modal, popout-style dialog, or full-page detail flow.
- Generated drawer pages must include the explicit end/right drawer template option, not only `templateOptions: #DEFAULT#`.
- Image-bearing entities can support Cards/gallery pages only when image/blob evidence exists.
- Latitude/longitude or geometry facts can support Map pages.
- Date/timestamp business records can support Calendar pages.
- Exploratory reporting can support Smart Filters or Faceted Search when target region and source columns are proven.
- Secondary maintenance pages can be grouped through a hub/list page when requirements or workflow clustering justify it.

## LOVs

### Static LOVs

| LOV | Values | Display / Return Semantics | Evidence | Consuming Pages / Items |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### Dynamic LOVs

| LOV | Display Column | Return Column | Source Object | Evidence | Consuming Pages / Items |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Rules:
- Every LOV must have display and return semantics backed by requirements, schema metadata, or explicit user assertion.
- Dynamic LOV display and return columns must exist in the `Source Evidence Matrix`.
- Static LOV values must come from requirements, check constraints, schema metadata, or explicit user assertion.

Faceted-search facet plans must distinguish runtime facet data types from SQL/report metadata. Date/time facets use `source.dataType: date`, numeric facets use `source.dataType: number`, and string facets omit `source.dataType` instead of using `varchar2` or `VARCHAR2`.

Faceted-search checkbox/radio facet plans must include value-list controls: default `maxDisplayedEntries` to `10`, keep justified values between `5` and `15`, and set `displayFilterInitially: true` for high-cardinality Product, Customer, Store, Assignee, Owner, User, Employee, Supplier, Email, SKU, name, or title facets.

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
- Help, accessibility, and guidance text:
- No-data and empty-state behavior:

## Plan Consistency Gate

Before drafting `.apx`, verify:

- Every requirement row is covered, excluded, or blocked.
- Every DB object and column used in the frozen plan has evidence.
- Every frozen page has a page inventory contract entry.
- Every frozen region has a page-local region plan entry and native component family.
- Every source mode decision is frozen as `table`, `view`, `sql`, or `none/staticContent`.
- Every link, modal target, page action, map target, and refresh dependency is declared in behavior coverage and mirrored in the app UX contract.
- Every shared LOV and breadcrumb entry is declared before artifact drafting.
- No generated artifact may add, remove, rename, or reorder pages, regions, actions, LOVs, breadcrumbs, or source shapes unless the spec is first repaired and the app UX contract is updated.

## Generation Readiness

- Required canonical templates or construction packs:
- Required compiler-truth queries:
- Required local validation:
- Required live validation, if any:
- Import eligibility blockers:

## Test Plan

| Scenario | Requirement / Acceptance Criteria | Pages / Regions | Expected Result | Validation Method |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

Include coverage for page inventory, navigation and launch paths, dashboards and analytics, report links and modal forms, LOV correctness, validations and constraints, refresh behavior, accessibility/guidance, local validation, and runtime validation when requested.

## Assumptions

- Low-risk assumptions only:

## Missing Inputs / Blockers

- Planning blockers:
- Generation blockers:
- Live validation/import blockers:
