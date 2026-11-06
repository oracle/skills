# APEX Region Interactions

## Purpose
Defines reusable APEXlang region interaction contracts for links, actions, filters, contextual regions, parent-child layout, and comments.

## Interaction and Action Constraints
- Chart regions do not own links or actions; use adjacent cards, reports, buttons, or list entries for navigation.
- Metric Card supports one row-level action position, `link`. Use a declarative behavior target, deterministic action sequence, projected row mappings, and no action template or label.
- Metric Card `redirectThisApp` and `redirectOtherApp` link behaviors require `target`; `redirectUrl` requires a reviewed safe `targetUrl`; `triggerAction` emits neither target property and requires a matching event consumer. Reject dangerous URL schemes, protocol-relative or wholly dynamic destinations, substitutions outside query parameters, inline handlers, URL overrides in `linkAttributes`, and unsafe new-window attributes. The URL scheme, host, path, and fragment must remain static.
- Metric Card grouping requires grouped child-column metadata plus deterministic static ordering; native single/multiple selection requires correctly typed same-page selection items and a primary-key child column.
- Cards `fullCard` links must not emit a label; Cards `button` links must emit a concise label.
- Native Cards actions are row navigation or decision actions using explicit `layout.sequence`; `button` actions use `label`, `layout.position`, and optional native `appearance`, while full-card/title/subtitle/media actions omit button-only fields. Use declarative `behavior.target` for redirects, and use a nested `triggerAction` child only with `behavior.type: triggerAction`, omitting navigation targets.
- When full-card navigation and a decision button coexist, document the intended precedence and evidence-backed conditions in the UX contract. Do not infer mutually exclusive business conditions from the action set.
- List regions are navigation-only; they bind to shared list entries and must not emit data sources, filters, hidden page items, columns, links, or actions.
- Management and launcher hub shared list entries should include `icon.imageIconCssClasses` with a conservative `fa-*` token and `userDefinedAttributes { 1: ... }` description text so media-list hubs render as scannable launch cards.
- Report drilldown should be modeled as report/column links or region-level links, not as unsupported report actions.

## Filter and Search Namespaces
- Only Faceted Search and Smart Filters regions may emit filter blocks; filter regions must not emit columns.
- Filter item names are page item tokens, not labels. Derive them from page number and database column: `P{page}_F_{UPPER_DB_COLUMN}`.
- Range filters use the same single canonical filter name as the database column; do not create `_FROM` and `_TO` item pairs for one range filter.
- Smart Filters search item token defaults to `P{page}_F_SEARCH`; avoid legacy `P{page}_SEARCH` for generated search items.
- A Smart Filters region must bind to exactly one APEX 24.2 Classic Report, Cards, Map, or Calendar base region through its explicit static id; sibling visualizations are not additional filter targets.
- Smart Filter search, suggestion, refinement, and count behavior must stay within the base region's effective authorization, server-side condition, and security-trimmed dataset.
- Treat `source.dbColumns` as an explicit searchable-attribute allowlist, not as permission to expose every base projection column.
- Filter item names must not collide with same-page hidden items or form page item names; suffix deterministically only when there is a real collision.

## Contextual and Parent-Child Layout
- Contextual Info regions must be Classic Reports with `Qualifier: Contextual Info`, SQL data source, and one effective row for the current context.
- Parent-child pages should keep parent context narrow and child detail broad inside the standard page body grid: parent Content Row at the body start and child regions in the remaining body columns.
- Master-detail Content Row pages must use `appearance.pageTemplate: @/standard`. Reserve `@/left-side-column` and `layout.slot: leftColumn` for faceted-search and filter/sidebar pages, not master-detail workbenches.
- Do not create full-width parent context plus full-width child regions when the page intent is parent-child comparison or maintenance.
- Treat a parent list/detail row that filters a child report by PK/FK as a master-detail page even when the prompt does not use the words "master detail".
- For master-detail pages, model parent selection with a report-mode Content Row plus a `fullRowLink` action that updates the same-page hidden context item, for example `P{page}_{PARENT_PK}` from `&PARENT_PK.`, and refreshes dependent child regions through dynamic-action behavior.
- Do not implement primary master-detail parent selection with `redirectUrl`, `targetUrl`, or an `f?p=` reload of the same page.
- Do not replace the parent row selector with a visible select list when the page already has or should have a parent Content Row. The parent context item must be hidden unless the user explicitly requests an editable selector.
- Child reports that bind to the selected parent item must include that item in `source.pageItemsToSubmit`.
- Child map layers that bind to the selected parent item must use normal `:P...` binds, must be refreshed explicitly after the parent context changes, and must not read selected context through `v()`/`nv()` session-state functions. Do not require or emit map-layer `source.pageItemsToSubmit` unless direct compiler truth for the active build proves it valid for the selected layer shape.
- When a child map requirement says marker selection opens a form, the map layer must expose a declarative link to the modal form and pass the map feature primary key.
- Master-detail action buttons such as create/edit child records belong in the child report toolbar slot, typically `rightOfInteractiveReportSearchBar`, not as free-floating body-grid buttons beside the regions.
- Master-detail workbenches must realize every required action: parent edit, child create, child edit/detail links, and page-level create actions. Page-level create actions belong in the breadcrumb/title-bar region when present.
- On non-modal management, search, and report pages with a breadcrumb/title-bar region, primary page-level create actions belong in that breadcrumb/title-bar region. Region toolbars are for region-scoped child/detail actions.
- Use `primaryActions` only for visible row-level menus/buttons. Use `fullRowLink` for row selection and drill-down of a Content Row master list.

## Comments and Context Cues
- Application, page, and region comments should be short functional sentences with purpose plus workflow, data role, navigation, or security context.
- Do not emit placeholder comments such as `todo`, `tbd`, `n/a`, `none`, `test`, `placeholder`, or lorem ipsum.
- When requirements are sparse, synthesize comments from application purpose, page goal, region function, and primary data/interaction responsibility.

Tags: apexlang, region, links, actions, filters, smart-filters, faceted-search, contextual-info, parent-child, comments
