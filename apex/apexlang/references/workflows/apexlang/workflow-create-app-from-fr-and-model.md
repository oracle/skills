# Workflow: Create App From Functional Requirements And Model

Use this workflow when the user asks to create or generate an app from functional requirements, FR, requirements, a data model, schema metadata, or similar local source documents. The intended user prompt can be as short as `create app from FR and model`.

## Inputs

- Functional requirements document, preferably Markdown.
- Authoritative model/schema metadata, such as offline schema dictionary, data model export, table metadata, or live DB metadata.
- Target app path or enough app-location context to resolve one.
- APEX workspace name only when materializing a brand new app or doing live validation/import.
- `db_connection_name` only for live DB metadata, validation, or import.

## Source Precedence

1. Model/schema metadata is authoritative for database objects, columns, keys, constraints, data types, display labels, LOV candidates, and semantic facts such as image, date, latitude/longitude, status, and amount fields.
2. Functional requirements are authoritative for business behavior, page inventory, workflow, page pattern intent, navigation, UI composition, validations, derived metrics, acceptance criteria, and exclusions.
3. `application-spec.template.md` defines the required planning output shape.
4. Existing app files may be read only for integration facts after app resolution. Do not use existing app files as reusable pattern or DSL-shape examples.
5. If same-rank sources conflict on structural facts, stop with `Missing Inputs` and list the conflict.

## Required Workflow

1. Resolve local context through the normal APEXlang startup flow before asking the user for paths. Prefer discovered requirements and authoritative model/schema files when the result is unambiguous.
2. Read the functional requirements and model/schema metadata completely enough to extract all required pages, objects, relationships, constraints, semantic columns, LOVs, and acceptance criteria.
3. Fill `application-spec.template.md` as an implementation-ready application spec. Do not generate `.apx` files until this spec exists.
4. Add an `Application Composition Plan` covering artifact scope, page groups, shared components, navigation, breadcrumbs, modal targets, refresh dependencies, and parent-child relationships.
   - Every non-modal user page must have a matching shared breadcrumb entry and a visible breadcrumb region wired to `@breadcrumb`; modal/dialog pages, page 0, and page 9999 are exempt.
   - Breadcrumb/title-bar regions must not use generic visible names such as `Breadcrumb` or `Title Bar`; use the current breadcrumb entry/page title as the region name, keep the title-bar/breadcrumb templates, and use live-valid template options such as standalone `#DEFAULT#`.
   - Breadcrumb hierarchy must be explicit, not just present. For each non-modal page, record the breadcrumb entry id and either its parent entry/page or `root: true`. Pages launched primarily from a hub, management hub, parent detail, or contextual report must be parented to that launch/context page using `appearance { parentEntry: @... }` in `shared-components/breadcrumbs.apx`.
   - Every requirement that says a report, parent row, child row, page button, or hub entry provides edit, create, open, or drilldown behavior must become a structured modal/link target or page action in the spec and UX contract, including source page, source region or column, target page, target item mappings, key column, and placement.
   - Every requirement that says a form must require, allow, validate, prepopulate, default, hide, display-only, or return after save/cancel must become a structured validation, form-context, or defaulting entry in the spec and UX contract. Record the target item, controlling item/value when conditional, source item/column for defaults, context ownership, and visible/hidden/editable state.
   - Master-detail workbenches must explicitly plan parent edit actions, child create actions, child edit links, and page-level create actions when the requirements call for them. Page-level create actions belong in the breadcrumb/title-bar when the page has a breadcrumb region.
   - Every `behaviorPlan.parentChildContext` entry must include `actionCoverage` for the required parent edit, child create, child edit/detail, and page-level create behaviors, with source region, target page, target item mappings, key column, and placement. If a behavior is explicitly out of scope, record the exclusion with requirement evidence.
   - Master-detail parent row selection must update the same-page hidden context item and refresh child regions through dynamic-action behavior. Do not implement the primary parent selection by redirecting/reloading the same page with a URL.
   - Master-detail map child regions must use normal `:P...` binds plus explicit child-region refresh behavior for selected context. Do not require or emit map-layer `source.pageItemsToSubmit` unless direct compiler truth for the active build proves it valid for the selected layer shape. If marker selection opens a form, add a structured modal target for the map layer with target page, marker key column, and target item mapping.
   - Multi-marker map pages must plan an initial viewport that fits the data. Prefer SQL-derived bounds from min/max latitude and longitude; do not plan `avg(latitude)` / `avg(longitude)` plus a fixed zoom unless requirements explicitly identify one known geography.
   - Management or launcher hub list entries must include a conservative `fa-*` icon and a short description so media-list hubs render as scannable launch cards rather than plain text links.
   - Every report region that opens a modal page must have a close-refresh dependency: an `apexafterclosedialog` dynamic action that refreshes the originating report region.
5. Add a `Rich UI Pattern Plan` by mapping proven model semantics and requirement intent to native APEX patterns:
   - amount/status/date facts can support dashboards with metric cards and charts
   - KPI, metric, count, total, revenue, average, and summary-card requirements on dashboard pages must become Metric Card plan entries with labels, values, icons, source SQL, and metadata; do not satisfy single-value KPIs with Classic Reports.
   - parent-child relationships can support workbenches or master-detail pages
   - image-bearing entities can support Cards/gallery pages
   - latitude/longitude facts can support Map pages
   - date/timestamp business records can support Calendar pages
   - exploratory reporting can support Smart Filters or Faceted Search
   - secondary maintenance pages can be grouped through a hub/list page
   - report-to-form CRUD defaults to a drawer end/right form unless the requirements explicitly select standard modal dialog, drawer start/top/bottom, wizard modal, popout-style dialog, or full-page detail flow
   - drawer form pages must emit `dialogTemplate: @/drawer` plus an explicit end/right drawer template option; `templateOptions: #DEFAULT#` alone is not enough for default drawer behavior
6. Write project-root `.apexlang/app-ux-contract.json` before drafting non-trivial `.apx` artifacts. This machine-readable contract must contain non-empty `sourceEvidence`, `pageInventory`, `compositionPlan`, `richUiPatternPlan`, `lovPlan`, `behaviorPlan`, and `testPlan` sections.
   - Every generated user page must map to a requirement or declared low-risk derived workflow.
   - `compositionPlan.breadcrumbs` must be an object array with `page`, `entry`, and either `root: true`, `parentEntry`, or `parentPage`; do not replace it with a flat page-number list.
   - If `compositionPlan.managementHubPages` is present, resolve the management hub page and parent every management child breadcrumb to that hub.
   - `behaviorPlan.modalTargets` or `compositionPlan.modalTargets` must list every report-to-form edit/create/open flow from the requirements; do not satisfy an edit requirement with only a dialog-close refresh dynamic action.
   - `behaviorPlan.parentChildContext` entries must include `actionCoverage`; do not stop at context item, parent region, and child region names.
   - `behaviorPlan.validations` must list every requirement-driven form validation, including conditional required rules such as `CUSTOMER_ID` required when `ORDER_CHANNEL = ONLINE`.
   - `behaviorPlan.formContext` must list context-owned form items that are populated by launch mappings and must not be user-editable, such as parent IDs on child create dialogs.
   - `behaviorPlan.formDefaults` must list every requirement-driven defaulting behavior, including source item, lookup/source column, target item, and whether the user may override the default.
   - Map marker edit/open flows count as modal targets and must identify the map source region/layer, marker key column, target page, and target item mapping.
   - `behaviorPlan.pageActions` or `compositionPlan.pageActions` must list page-level create/action buttons with their target page and placement, for example `placement: breadcrumb`.
   - Faceted-search range/date facets must list their source column and runtime data type. Use `date` for date/time columns such as `ORDER_DATE`, `ORDER_DATETIME`, and `TIMESTAMP` schema columns; use `number` for numeric facets; omit `source.dataType` for string facets.
   - Faceted-search checkbox/radio facets must plan `maxDisplayedEntries` and high-cardinality value filtering. Default `maxDisplayedEntries` to `10`, keep justified values between `5` and `15`, and set `displayFilterInitially: true` for Product, Customer, Store, Assignee, Owner, User, Employee, Supplier, Email, SKU, name, or title facets.
   - `compositionPlan.managementHubEntries` must include icon and description fields for every launcher entry.
   - Every declared rich UI pattern, display mapping, link, modal target, refresh dependency, LOV, layout recipe, and accessibility/guidance requirement must be traceable to requirements, model/schema metadata, or explicit user assertion.
   - Add `requiresAppUxContract: true` to the app-local `.apex/apexlang.json` runtime metadata for full-app FR/model generation so local validation blocks missing UX contracts.
   - Keep the completed `application-spec.md` planning artifact in project-root `.apexlang/`, not inside `applications/<app>/` or the app-local `.apex/` runtime metadata directory.
7. For every SQL-bearing page, region, LOV, validation, or process, record object evidence as `schema_doc`, `live_db`, `user_asserted`, or `unresolved`.
8. If any required object, column, relationship, target page, target item, UX contract mapping, or compiler-truth decision remains unresolved, stop with `Missing Inputs` instead of drafting artifacts.
9. After the spec and UX contract are complete, run the normal APEX generation workflow. For each non-trivial page or shared component, emit a compact `Generation Plan` before APEXlang.
10. Validate generated artifacts with local validation and compiler-truth audit before publish, live validation, or import eligibility. Live validation/import still requires explicit `db_connection_name` and matching APEX workspace name.

## Output Contract

The completed application spec must be traceable:

- every page maps to one requirement or low-risk derived workflow
- every DB object and column maps to model/schema evidence or explicit user assertion
- every rich UI pattern maps to native APEX components, not static HTML substitutes
- every link or modal target identifies the target page and item mappings
- every form target records its presentation choice and button/process/dynamic-action contract
- every form validation, context-owned item, and defaulting behavior maps to requirement evidence and generated page artifacts
- every test maps to functional acceptance criteria or runtime validation gates
- `.apexlang/app-ux-contract.json` mirrors the application spec in validator-readable form at the user project root

## Stop Conditions

- Missing or ambiguous functional requirements.
- Missing or ambiguous authoritative model/schema metadata for DB-backed generation.
- Conflicting page inventory, table, column, key, or constraint facts.
- Rich UI pattern requested without the required semantic evidence.
- Missing or incomplete project-root `.apexlang/app-ux-contract.json` for full-app FR/model generation.
- Unresolved compiler-truth requirement for a non-exact-match structural artifact.
- Missing APEX workspace name when materializing a brand new app.
- Missing `db_connection_name` or workspace name for live validation/import.
