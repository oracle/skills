> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.

# Agent 1 — Draft (Child Workflow)

Purpose
- Generate the initial APEXlang draft artifact from the provided inputs with minimal token/context usage.

Inputs
- target_type
- intent
- data_contract
- styling? (none by default)
- output_path? (defaults to `applications/app_###/` for page/component scope)
- server_side_condition? (structured object from master workflow)

<authority_rules>
- Shared prompt contract: `references/workflows/apexlang/prompt-contracts.md`
- Follow the hierarchy, rule IDs, intermediate artifacts, and stop conditions defined there.
- If a phase-specific note conflicts with that contract, the shared contract wins.
</authority_rules>

<task_scope>
- Generate the initial APEXlang draft artifact from the provided inputs.
- Use templates and governance to choose the exact emitted shape; do not widen scope or invent fallback artifacts.
- Treat the Generation Plan as the boundary of what may be emitted. Do not add pages, regions, interactions, links, items, or component behavior that the plan did not authorize from loaded rules, templates, compiler truth, or the app spec.
- Follow the posted rules and workflow first. Do not guess while a higher-precedence rule source still provides an unanswered next step.
</task_scope>

<allowed_sources>
- **Templates:** Use `templates/**` only; never invent attributes or UT classes.
- **Pattern lookup order:** For page-scoped work, load the matching family under `templates/page-examples/**` first, then the narrower supporting family under `templates/**`.
- **Design boundary:** UX concepts, page patterns, component families, interactions, navigation modes, and template options must come from current template documentation, loaded memory-bank rules, governance, compiler-backed truth, or the approved application spec. Do not synthesize unsupported richer patterns from product intent alone.
- **Target-app isolation:** For app-scoped work, read the resolved target app only for integration facts such as ids, aliases, navigation entries, breadcrumb entries, and artifact paths. Do not derive reusable patterns, layout conventions, naming conventions, or DSL structure from any `applications/**` tree unless the user explicitly requests cross-app comparison, migration, parity, or example lookup.
- **Schema contract:** When `assets/component-attributes.json` defines the component, treat it as the repo-safe subset for that covered shape. Draft only blocks/properties allowed by that subset unless direct compiler validation or compiler metadata for the active runtime proves otherwise. If template prose/examples disagree, treat the template as defective and do not copy the unsupported attribute.
- **Exact-match template shortcut:** Reuse a canonical template directly only when the component family and variant, parent context, nesting shape, and conditional mode already match, and the change is limited to safe instance substitutions such as labels, names, ids, aliases, and SQL text.
- **Compiler-truth escalation:** If no exact-match template exists, or the edit introduces a new property, nested block, enum token, slot, template option, or layout attribute, query compiler-backed truth with `tools/query-valid-props.mjs` before drafting. If compiler-backed truth cannot be resolved, emit Missing Inputs instead of inventing syntax.
- **Compiler-truth evidence:** Draft output must be eligible for `node tools/apexctl.mjs apexlang compiler-truth audit --app-path <temp_app_path> --verify-component-attributes`. Record the planned audit evidence path in the parallel contract payload.
- **Authority order:** For APEXlang shape decisions, direct compiler validation or compiler metadata outranks `assets/component-attributes.json`, which outranks template prose and examples.
- **Snippet classification:** Treat unclassified examples as `illustrative_prompt` only. They can help route intent, but they are not schema evidence and must not supply table, column, page, item, API, LOV, or region identifiers.
- **Metavariable templates:** Output-template snippets that contain `{{...}}` variables are structure-only until every variable is bound from authoritative context. Do not emit unresolved variables or prompt-only pseudo-identifiers in generated `.apx`.
</allowed_sources>

<exact_match_policy>
- Follow `EXACT_MATCH_TEMPLATE_REQUIRED_001`.
- Reuse a canonical template directly only when the component family and variant, parent context, nesting shape, and conditional mode already match, and the change is limited to safe instance substitutions such as labels, names, ids, aliases, and SQL text.
</exact_match_policy>

<compiler_truth_contract>
- Follow `COMPILER_TRUTH_EVIDENCE_REQUIRED_001`.
- If no exact-match template exists, or the edit introduces a new property, nested block, enum token, slot, template option, or layout attribute, query compiler-backed truth with `tools/query-valid-props.mjs` before drafting.
- When compiler-truth escalation is triggered, emit a `Compiler Truth Evidence` section before the Generation Plan or APEXlang artifact. For each affected component family, record the exact `query-valid-props` command, checked scope, conclusion, and emitted decision.
- Draft output must be eligible for `node tools/apexctl.mjs apexlang compiler-truth audit --app-path <temp_app_path> --verify-component-attributes`. Record the planned audit evidence path in the parallel contract payload.
- Local validator success does not replace compiler-truth evidence for a structural edit.
</compiler_truth_contract>

<generation_plan_contract>
- Follow `GENERATION_PLAN_REQUIRED_001`.
- For non-trivial page, component, or application generation, emit a compact `Generation Plan` section before the APEXlang artifact.
- Treat only same-property wording/value edits on existing documented properties as trivial. Any change that adds, removes, or reshapes page, region, item, button, SQL, LOV, validation, process, dynamic-action, navigation, template-option, source-mode, target-mapping, component-family, or behavior structure is non-trivial.
- Prompts that say `simple`, `basic`, `starter`, `lightweight`, or `quick` still require a Generation Plan when they create or change structure.
- The plan must include the minimum required fields from the shared contract: target artifact scope, exact template family or variant, region/item/button inventory in output order when applicable, source mode decisions such as `table/view` vs `sql`, navigation or target decisions, and compiler-truth evidence references when required.
- For each non-trivial page/region family, the plan must identify the loaded template, rule, compiler-truth source, or app-spec decision that permits the emitted shape. If a richer requested design has no supported source, plan the closest simpler documented native APEX pattern, a workflow-permitted placeholder, or a Missing Inputs stop.
- Response order for non-trivial structural generation is: `Compiler Truth Evidence` when required, then `Generation Plan`, then generated APEXlang.
</generation_plan_contract>

<output_contract>
- Emit APEXlang exclusively; wrap SQL in triple backticks.
- Write `.apx` artifacts with LF line endings only; do not emit CRLF in generated or revised `.apx` files.
- Emit one property per line.
- For object-valued properties, emit `name: {` on its own line and place nested properties on following lines.
- Never compress nested property-objects onto one line.
- Direct compiler validation or compiler metadata outranks exact-match canonical templates and examples; `assets/component-attributes.json` is a repo-safe subset and fallback note after those stronger sources are exhausted.
</output_contract>

<stop_conditions>
- Follow `RULES_FIRST_WORKFLOW_REQUIRED_001`.
- Follow `HUMAN_INTERVENTION_REQUIRED_001`.
- If the posted rules, workflow, templates, and compiler-backed truth still do not answer a required high-impact decision, emit Missing Inputs or request explicit human intervention instead of inferring.
- If compiler-backed truth cannot be resolved, emit Missing Inputs instead of inventing syntax.
- If a non-exact-match structural edit requires compiler truth and the response cannot supply the required evidence entry, emit Missing Inputs instead of drafting the artifact.
- If a non-trivial structural artifact requires a Generation Plan and the required plan fields cannot be supplied, emit Missing Inputs instead of drafting the artifact.
- If no loaded authoritative source proves a requested property, enum value, block name, target shape, item mapping, component capability, page pattern, interaction, or navigation mode, do not emit it. Simplify to a documented supported pattern, use a workflow-permitted placeholder, or stop with Missing Inputs.
- If a required `{{...}}` metavariable, schema object, item, region, LOV, API, or navigation target cannot be bound from authoritative context, emit Missing Inputs instead of copying placeholder text or fake identifiers.
- Use bounded inference only after all higher-precedence rule and workflow sources are exhausted, and only for low-risk connective details that do not change structural legality.
</stop_conditions>

Detailed constraints
- **Interactive Report column headings:** Emit `heading { heading: ... }` for every Interactive Report column, including `type: hidden`, because that is the schema- and compiler-safe emitted shape.
- **Interactive Report column links:** For region `type: interactiveReport`, never emit `type: link`; use `type: plainText` and a column-level `link { target: ... linkText: ... }`.
- **Classic Report hidden columns:** When a Classic Report column is `type: hidden`, omit the `heading {}` block entirely. Do not copy the Interactive Report hidden-column rule into Classic Report.
- **Concrete output precedence:** When family template prose or variable-contract text conflicts with concrete emitted output blocks, validator behavior, or same-family page examples, follow the concrete emitted shape and flag the template as defective for cleanup. Do not preserve stale aliases such as shared LOV `type: sharedLov` / `sharedLov: @alias` when the accepted DSL is `type: sharedComponent` / `lov: @alias`.
- **Region/type safety:** For covered components, do not emit region-type-specific blocks or properties unless they are explicitly allowed by the component-attributes contract. Treat unsupported template examples as defects.
- **Calendar safety:** For `region` with `type: calendar`, use the schema-approved calendar subset even when older examples show additional settings. Require `settings.pkColumn` for every calendar, source it from the underlying table primary key column, restrict `settings.additionalCalendarViews` to `list` and `navigation`, and treat unsupported calendar settings as template defects and omit them.
- **Calendar link targets:** For `settings.createLink` and `settings.viewEditLink`, emit structured object syntax with required `page` and optional `items`. Never infer target page numbers or target item names. If the user requests calendar navigation without a target page or required mapping, ask once and then stop with Missing Inputs if still unresolved.
- **Report-region link targets:** For Classic Report, Interactive Report, and Interactive Grid navigation, ask every time which mode is required: same application page, another application page, or URL redirect. After one clarification round, stop with Missing Inputs if unresolved.
- **Same-app report links:** When the user chooses same application page and the DSL supports it, emit declarative page-target syntax. Do not default report-region navigation to `type: url`, `f?p=...`, or SQL-computed `apex_page.get_url(...)`.
- **Same-app button redirects:** For `behavior.action: redirectThisApp`, emit a declarative `target: { page, items, clearCache, action, request }` object. Do not emit `target: f?p=...`.
- **Native Content Row row selection:** When the user asks for Content Row focus-only, single-row, or multiple-row selection, draft report-mode `themeTemplateComponent/contentRow` using `content-row.report-grouping-selection.md`. For focus-only, emit only `rowSelection { type: focusOnly }`. For single selection, emit `rowSelection { type: singleSelection currentSelectionPageItem: Pn_SELECTED_KEY }` and create that same-page hidden item. For multiple selection, emit `rowSelection { type: multipleSelection currentSelectionPageItem: Pn_SELECTED_KEYS selectAllPageItem: Pn_SELECT_ALL }`, create the hidden current-selection item, and create the select-all checkbox item, typically in a toolbar/static-content container.
- **Master-detail Content Row selection:** When a parent list/detail row filters child regions by PK/FK, draft the parent as report-mode `themeTemplateComponent/contentRow` using `content-row.report-master-detail-full-row-link.md`, add a `fullRowLink` action that sets a same-page hidden context item, and bind child reports to that hidden item via `source.pageItemsToSubmit`. Native `rowSelection.currentSelectionPageItem` may still represent selection state, but it does not satisfy master-detail context setting.
- **Master-detail dynamic behavior:** Do not implement primary parent row selection with `redirectUrl`, `targetUrl`, or an `f?p=` same-page reload. Parent selection must update the hidden context item and refresh dependent child regions through dynamic-action/declarative behavior.
- **Master-detail action coverage:** For full-app generation, realize every required parent-child action from the requirements: parent edit, child create, child edit/detail links, and page-level create. Put page-level create actions in the breadcrumb/title-bar region when a breadcrumb region exists; put child create/edit/detail actions in the child report toolbar.
- **Parent-child UX contract action coverage:** Every `behaviorPlan.parentChildContext` entry must include `actionCoverage` for parent edit, child create, child edit/detail, and page-level create behaviors unless explicitly excluded with requirement evidence. Do not stop at context item, parent region, and child region names.
- **Form behavior UX contract:** For full-app FR/model generation, every form requirement that says a value is required, conditionally required, prepopulated, defaulted, hidden, display-only, or user-overridable must be represented in `behaviorPlan.validations`, `behaviorPlan.formContext`, or `behaviorPlan.formDefaults` before page drafting. Include target item, controlling item/value, source page/region, source item/column, and override policy as applicable.
- **Master-detail map children:** Map layers that depend on selected parent context must use normal same-page item binds such as `:P7_ORDER_STATUS` plus explicit refresh behavior; never use `v()`/`nv()` session-state reads or string-concatenated page item names. Emit map-layer `source.pageItemsToSubmit` only when direct compiler truth for the active build proves it valid for the selected layer shape. If requirements say marker selection opens a form, emit a map layer `link { target: { page, items } }` that passes the marker primary key.
- **Map initial viewport:** For multi-marker maps, do not use `avg(latitude)` / `avg(longitude)` with a fixed zoom level. Prefer a SQL-derived `boundingBox` using min/max longitude and latitude over the same filtered dataset, and omit `infiniteMap` when bounding-box metadata is used. Use fixed zoom only when requirements explicitly identify one known geography or single-location viewport.
- **Management/launcher hub visual affordance:** For media-list hub pages, give every shared list launcher entry a conservative `fa-*` icon and a short `userDefinedAttributes { 1: ... }` description. Do not emit plain text-only management hub links.
- **Icon literals:** For every generated icon-bearing property, use Font APEX `fa-*` classes only. Do not emit Material, JET, image, custom CSS, or alias icon values.
- **Primary create placement:** On non-modal management, smart-filter, search, and report pages with a breadcrumb/title-bar region, place primary page-level create buttons in the breadcrumb/title-bar region, usually `layout.region: @breadcrumb` and a title-bar action slot. Do not anchor Create Product/Create Customer/Create Store style actions to the results report toolbar.
- **Faceted-search data types:** For facet `source.dataType`, emit only runtime-safe facet tokens. Date/time facets, including `ORDER_DATE`, `ORDER_DATETIME`, and `TIMESTAMP` schema columns, use `dataType: date`; numeric facets use `dataType: number`; string/discrete facets omit `source.dataType` and must not emit `varchar2`, `VARCHAR2`, or report-column tokens.
- **Faceted-search value lists:** For checkbox/radio facets, emit `listEntries.maxDisplayedEntries: 10` unless requirements justify another value between 5 and 15. For likely high-cardinality facets such as Product, Customer, Store, Assignee, Owner, User, Employee, Supplier, Email, SKU, name, or title, also emit `listEntries.displayFilterInitially: true`.
- **Content Row settings syntax:** For Content Row `settings.overline`, `settings.title`, `settings.description`, and `settings.miscellaneous` backed by query columns, emit `&COLUMN_NAME.` substitutions rather than bare column aliases; literal settings such as `overline: Employee` are valid.
- **Master-detail parent item shape:** Do not create a visible select list as the primary parent selector when a Content Row parent list is present. Use a protected hidden item such as `P{page}_{PARENT_PK}` unless the user explicitly requests a manual selector.
- **Template-component row selection identity:** For any template component that emits `rowSelection` with a non-null mode, mark one child `column (...)` with `source.primaryKey: true`.
- **Content Row grouping ordering:** When any Content Row child column uses grouping, emit top-level `orderBy {}` and sort by all grouped columns first, in grouping order, before any remaining tie-breakers.
- **Content Row projection coverage:** In report mode, emit explicit child `column (...)` metadata for the delivered source projection by default, in source order. Do not stop at a compiler-minimum subset when the region source projects more fields.
- **Metric Card projection coverage:** In report mode, emit explicit child `column (...)` metadata for every delivered source projection before finals. Do not stop after a single compiler-satisfying column when the source projects multiple fields.
- **Metric Card multi-card source pattern:** A single Metric Card region may render multiple cards from multiple rows. When the user wants several independent metrics in one region, prefer a normalized multi-row source, usually `UNION ALL` across one SELECT per metric so every row projects the same aliases in the same order.
- **Dashboard KPI component selection:** Dashboard KPI/count/total/revenue/average requirements must be emitted as `themeTemplateComponent/metricCard`, usually one normalized Metric Card strip. Do not emit single-value KPI tiles as `classicReport` regions, even when the SQL is a simple aggregate.
- **Metric Card property surface:** Do not assume Metric Card only exposes `settings.title` and `settings.metric`. Use the accepted `settings`, `plugin-avatar`, `plugin-badge`, and `rowSelection` surface from the family guidance, and do not require those property names to mirror child-column names one-for-one. For Metric Card avatar rendering, use `plugin-avatar.displayAvatar` plus the typed avatar payload inside `plugin-avatar`. For Metric Card badge rendering, use `plugin-badge.displayBadge` plus badge fields inside `plugin-badge`. Do not emit Metric Card `settings.displayAvatar` or `settings.displayBadge`.
- **Dashboard layout row planning:** For dashboards, create a `layout_row_plan` in the Generation Plan before emitting KPI strips, chart rows, report/detail rows, or side-by-side component rows. Each entry must include `slot`, `row`, `recipe`, and ordered `regions` static IDs. Each entry is one physical row. KPI strips default to one normalized Metric Card region with `recipe: metric-card-strip`. Default chart rows are: 2 charts -> one `two-up-equal`; 3 charts -> one `three-up-equal`; 4 charts -> two `two-up-equal`; 5 charts -> one `two-up-equal` then one `three-up-equal`; more than 5 charts -> repeat `two-up-equal` and `three-up-equal` while preferring balanced rows. Do not emit generic `dashboard-chart-flow`. Do not literally stack multiple dashboard charts unless the user explicitly requests vertical stacking or a chart is intentionally a detail/full-width section.
- **Dashboard layout row emission:** The emitted artifact must match the `layout_row_plan`. The first region in each planned row omits `layout.startNewRow`; second-and-later regions in that same planned row set `layout.startNewRow: false`. Never carry `startNewRow: false` from the previous row into a new KPI, chart, cards, or detail row. Stacked full-width detail, contextual summary, and cards sections must be separate one-region row-plan entries; never list multiple stacked sections in one `regions` array.
- **Breadcrumb hierarchy:** For full-app generation, do not emit flat shared breadcrumbs. `compositionPlan.breadcrumbs` must list every non-modal page with `page`, `entry`, and either `root: true`, `parentEntry`, or `parentPage`; hub-launched and management pages must use `appearance { parentEntry: @... }` in `shared-components/breadcrumbs.apx`.
- **Breadcrumb title-bar labels:** Do not emit `name: Breadcrumb`, `name: Breadcrumbs`, `name: Title Bar`, or other generic chrome labels on visible breadcrumb/title-bar regions. Use the page title/current breadcrumb entry as the region name, keep `appearance.template: @/title-bar`, and use live-valid template options such as standalone `#DEFAULT#`.
- **Full-app UX contract:** For complete app generation from functional requirements plus model/schema metadata, write project-root `.apexlang/app-ux-contract.json` before drafting non-trivial `.apx` files and set app-local `.apex/apexlang.json` `requiresAppUxContract: true`. Keep the completed `application-spec.md` in project-root `.apexlang/`, not inside `applications/<app>/` or app-local `.apex/`. The contract must contain non-empty `sourceEvidence`, `pageInventory`, `compositionPlan`, `richUiPatternPlan`, `lovPlan`, `behaviorPlan`, and `testPlan` sections. Declare only UX patterns, display mappings, links, modal targets, refresh dependencies, LOVs, layout recipes, and accessibility/guidance requirements that are supported by requirements, model/schema metadata, or explicit user assertion.
- **Fail-closed form UX:** Do not satisfy form requirements with generic Auto Row DML alone. Conditional required rules need page-level validations; parent/context IDs passed from a launcher must not render as editable fields; lookup defaults need explicit default or set-value behavior.
- **Report-type template component projection coverage:** Apply the same default to other report-type template components such as Media List and Comments: emit explicit child `column (...)` metadata matching the delivered source projection by default, not just the minimum needed to satisfy a first compiler error.
- **Interactive Report projection coverage:** Emit explicit `column (...)` definitions for every Interactive Report SQL projection before finals; visible business, derived, status, and action columns need display metadata and comments, while hidden technical columns still need headings.
- **Classic Report projection coverage:** Emit explicit `column (...)` definitions for every delivered Classic Report SQL/table projection before finals. When row navigation is intended, keep the PK as an explicit declarative-navigation column; otherwise keep the PK hidden.
- **Cards image mapping:** When a cards design calls for images or thumbnails and the source projects an image-bearing value, map it through the native cards `media.image` hook. Use the raw BLOB alias for BLOB-backed images, a projected image-URL column alias for URL-backed images, or an `&COLUMN.` substitution-backed URL value when the source already projects a usable image URL string.
- **Smart Filters targets:** Use the canonical search-filter shape with `source.dbColumns`, and bind `filteredRegion` only to the page's authoritative results region. Map regions are valid Smart Filter targets only when the map layer projects every filtered column; do not target map layers or other filter regions.
- **Image Upload 26.1 contract:** For `imageUpload`, stay within the generic item contract plus compiler-backed form binding fields. Do not emit legacy upload-specific settings such as `storageType`, `displayAs`, or `allowMultipleFiles`, and do not emit legacy source metadata such as `mimeTypeColumn`, `filenameColumn`, or `blobLastUpdatedColumn` unless compiler truth proves a current-runtime exception.
- **Calendar link item mappings:** Only map calendar-link items from user-provided target item names and explicit SQL aliases or supported calendar substitution tokens already present in the accepted inputs.
- **Calendar drag/drop persistence:** When `dragAndDrop: true`, always update the start-date column using `:APEX$PK_VALUE` and `:APEX$NEW_START_DATE`. Update the end-date column with `:APEX$NEW_END_DATE` only when the calendar contract also defines `endDateColumn`; do not require `endDateColumn` just to enable drag/drop.
- **Composite template options:** If a template or valid-values catalog shows a whitespace-joined UT option such as `t-Region--hideHeader js-addHiddenHeadingRoleDesc`, copy it atomically as one `templateOptions` entry; never split it into multiple values.
- **Exact template-option values:** Keep `#DEFAULT#` as its own entry, keep documented composite values atomic, and pass only the documented accepted value for the family. Never concatenate `#DEFAULT#` with another token and never emit a legacy alias when the owning family documents emitted CSS/composite values instead, for example use `t-CardsRegion--styleA` rather than `style-a`.
- **Classic Report default templates:** For every `classicReport` region, emit the canonical shared defaults exactly as `appearance { template: @/standard templateOptions: #DEFAULT# }` plus `componentAppearance { template: @/standard templateOptions: [ #DEFAULT# t-Report--stretch t-Report--horizontalBorders ] }`. This means Stretch Report is on, report borders are horizontal only, alternating rows are disabled by omission, and row highlight is not on by default. Live compiler validation for 26.1 maps missing report template to property `411` and reports `componentAppearance - template (string)`, so never omit the Classic Report `componentAppearance.template`. For the documented `@/contextual-info` wrapper variant, set `appearance.templateOptions` exactly to `[ #DEFAULT# t-Region--hideHeader js-addHiddenHeadingRoleDesc t-Region--noUI ]` while keeping `componentAppearance.template: @/standard` and the canonical report component options.
- **Drawer form default:** Report-to-form create/edit pages default to `appearance.pageMode: modalDialog`, `appearance.dialogTemplate: @/drawer`, and an explicit `js-dialog-class-t-Drawer--pullOutEnd` template option unless requirements explicitly select centered dialog, start/top/bottom drawer, wizard, or full-page behavior.
- **Button template-option values:** For button `appearance.templateOptions`, emit only canonical button-family UT class values such as `t-Button--iconLeft`, `t-Button--iconRight`, `t-Button--hoverIconPush`, `t-Button--mobileHideLabel`, `t-Button--primary`, `t-Button--simple`, `t-Button--tiny`, and `t-Button--stretch`. Never emit aliases/static_ids or naked suffix tokens such as `left`, `right`, `push`, `hide-label-on-mobile`, `primary`, or `tiny`. For `@/text-with-icon` buttons with `icon`, include exactly one icon-position option and default to `t-Button--iconLeft`; omit left/right icon-position options for `@/icon`.
- **Template-option array formatting:** When a `templateOptions` array contains more than one accepted value, emit a bracketed multi-line array with one accepted value per line. Never emit inline comma-separated arrays such as `[#DEFAULT#, t-Report--stretch]`.
- **DSL format:** Emit APEXlang exclusively; wrap SQL in triple backticks.
- **Artifact boundary:** For APEXlang generation tasks, do not draft unrelated helper source files unless the user explicitly requested tooling or scripts.
- **Business logic:** Prefer declarative constructs; keep heavy logic in database packages/views.
- **DML safety:** Guard DML by button/process in every draft.
- **Dynamic actions:**
  - Single page → `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions.md`.
  - Batch (`targets`; legacy `target_pages`) → `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions-batch.md`.
  - Execute API batch → `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions-plsql-batch.md`.
  - Emit only approved `when.event` values from `templates/business-logic/dynamic-actions/dynamic-actions._common.md`; never invent aliases such as `dialogClosed`.
  - For dialog-close refresh, default to `apexafterclosedialog`; use `apexafterclosecanceldialog` only when the requested behavior is specifically tied to cancel-close flows.
- **Translations:**
  - Single key→language pair(s) → `references/domains/shared-components/workflow-translations.md`.
  - Bundle (`translations-batch`) → `references/domains/shared-components/workflow-translations-batch.md`.
  - If a prompt combines translation/language terms with an explicit page-control request such as `button`, `menu`, or `selector`, do not draft localization artifacts until runtime-switch versus localization intent is clarified.
- **Page processes:**
- Batch invokeApi → `references/domains/business-logic/processes/workflow-page-processes-batch.md`.
- Item computations (`computation-plsql-batch`) → `references/domains/business-logic/computations/workflow-computations-batch.md`.
- **Batch contract normalization:**
  - For batch target types, normalize legacy keys (`target_pages`, `target_items`, `target_buttons`, `target_button`, `apply_to`) into canonical `targets` before drafting.
  - Preserve backward compatibility in inputs, but produce draft summaries/change-log payloads using canonical `targets` + `operation`.
- **Rule loading:** Follow `assets/rules-mapping.json` (00-guard + 10-global always; add 20/30/40/50 partitions only when needed).
- **Fallback behavior:** If the target app plus governance/templates do not provide enough information to draft safely, emit Missing Inputs or ask the user. Do not use any `applications/**` tree as a fallback reference.
- **Prerequisite metadata gate (all APEX artifact runs):**
  - Resolve `prereq_source` before drafting any APEX artifact.
  - Ask whether the run should use `offline` or `live DB` first for interactive DB-backed flows.
  - If `offline` is chosen, inspect `assets/workspace-intelligence.json` and eligible `workspace schema dictionaries discovered by `node tools/apexctl.mjs workspace probe`` schema dictionaries.
  - If `live DB` is chosen and the user does not already know the target connection, traverse saved SQLcl connections and ask the user to choose one before falling back to manual `db_connection_name` entry.
  - Require the user to specify the corresponding APEX workspace name before live metadata validation, `apex validate`, `apex import`, runtime diagnostics, or new-app materialization.
  - Treat `prereq_source: schema_doc` as valid for offline metadata reasoning only.
  - Treat `db_mode: online` as requiring explicit `db_connection_name` and the corresponding APEX workspace name.
  - Treat `db_mode: offline` as explicit user confirmation only; never infer it.
  - In offline mode, do not attempt live metadata validation, `apex validate`, or `apex import`.
- **Layout planning:** Load `30-pages/apex.layout.md` for page-scoped runs. Build row recipes per layout scope: page slot rows, nested `parentRegion` rows, item rows by `layout.region + layout.slot`, and button rows by `layout.region + layout.slot`. Generated `applications/**` finals are linted with the same deterministic layout rules as drafts. For equal-width rows, emit sequence ordering plus `startNewRow: false` on second-and-later siblings and omit `column` / `columnSpan`. Use `leftColumn` + `body` only for documented filter/sidebar shells such as faceted search. When an asymmetric body-grid row is required, allow the anchored-sibling pattern: first region may emit `columnSpan` only, later siblings may emit `column`; do not force `column: 1` onto the first region and do not classify that recipe as invalid mixed layout. For master-detail Content Row pages, use `appearance.pageTemplate: @/standard` and the `master-detail-content-row` recipe: narrow parent Content Row in `BODY` first with `columnSpan: 3` or `4`, `appearance.template: @/standard`, child report in `BODY` second with `startNewRow: false`, hidden parent context item, and child action buttons in the child report toolbar slot.
- **DB-first gate (all DB-backed artifacts):**
  - Applies to DB-backed page/report/form/LOV SQL/region SQL generation.
  - Before drafting SQL for real DB objects, require metadata verification evidence for source object, selected columns, and sort (`ORDER BY`) columns where used from either the selected schema dictionary or live DB metadata.
  - For SQL-backed template components, draft ordering only in top-level `orderBy {}` and keep `source.sqlQuery` free of `ORDER BY`.
  - Apply `SQL_PLSQL_LOB_COMPARISON_KEY_FORBIDDEN_001` from `references/policies/memory-bank/20-data/apex.sql.md` before emitting any report SQL, LOV SQL, dynamic SQL, cursor SQL, `sqlQuery`, or PL/SQL-owned query body. Raw `BLOB`, `CLOB`, `NCLOB`, and `BFILE` expressions may be projected/displayed where supported, but must not be grouped, ordered, distincted, used in set operations, analytic key clauses, equi-joins, or `WHERE`/`HAVING` comparison predicates.
  - For LOB-adjacent sort/group/filter/rank/join/distinct intent, draft against scalar surrogates only: PK/FK, filename, MIME type, charset, last-updated timestamp, modeled checksum/hash, or `dbms_lob.getlength(<lob_expr>)` for size. If ranked or aggregated output must display a LOB, use a scalar inner query first, then join back to project the LOB in the outer query.
  - If metadata evidence is missing, emit Missing Inputs and stop (no draft artifact output).
  - Offline mode without schema-doc coverage: only emit mock/sample SQL when the user explicitly requests offline/mock output after DB mode is resolved; clearly label it as unverified sample SQL.
  - Draft summary payload must include a metadata note documenting the selected schema dictionary or verified object/columns/sort columns from live metadata, or explicit offline mock status.
- **NL2IR metadata precedence (hard requirement):**
  - For Interactive Reports with `genAI { naturalLanguageSupport: true }`, resolve `genAI.reportContext` using table/view annotation `report_context` first, then annotation `description`, then table/view comment.
  - Resolve `column.genAI.columnContext` using column annotation `column_context` first, then `ai_context`, then `description`, then column comment.
  - Require metadata evidence from an annotation scan for the target object/column before falling back to comments; do not treat a single-key probe as sufficient evidence that annotations are absent.
  - Do not emit comment-based NL2IR context when a non-empty canonical or descriptive annotation value exists.
  - If neither annotation nor comment exists, omit the corresponding NL2IR context field instead of inferring text.
- **Report SQL presentation contract (hard requirement):**
  - For Classic/Interactive/Grid report SQL and related report-rendering SQL/PLSQL sources, never emit HTML literals/tags in SQL/PLSQL.
  - Return raw values/flags in SQL and render styled output (badges/highlights/status chips) using `columnFormatting.htmlExpression` as defined in `references/policies/memory-bank/30-pages/apex.report-column-rendering.md`.
  - For `mmdVersion 26.1.053`, do not emit top-level column `htmlExpression`.
  - When emitting `columnFormatting.htmlExpression`, do not emit `type: richText`; keep plain text type implicit unless a non-default type is required.
  - For `WHERE` value comparisons on columns ending with `_static_id`, emit normalized predicates only:
    - `lower(col_static_id) = lower(<value_or_bind>)`
    - `lower(col_static_id) != lower(<value_or_bind>)`
    - `lower(col_static_id) in ('lowercase','values')`
  - For Interactive Report SQL with page-item-driven text search or filter binds, emit normalized predicates only:
    - `lower(col) = lower(:PXX_ITEM)`
    - `lower(col) != lower(:PXX_ITEM)`
    - `lower(col) like '%' || lower(:PXX_SEARCH) || '%'`
  - Do not apply the Interactive Report text-filter normalization rule to Classic Report or Interactive Grid drafts unless another policy explicitly requires it.
- **Interactive Grid saved-report metadata contract (hard requirement):**
  - Apply this rule to any user-prompted APEXlang development or implementation work that touches Interactive Grid saved reports.
  - For Interactive Grid saved-report charts, treat `LABEL` as the implicit default sort behavior; do not emit explicit `LABEL` unless the concrete DSL contract requires it.
  - For Interactive Grid saved-report aggregates, do not strip metadata-backed view/static-id fields from the accepted contract when they are structurally visible.
- **Reference and item compatibility checks (hard requirement):**
  - Emit authorization scheme references with alias syntax (`@alias`) in all `security.authorizationScheme` fields.
  - Emit validation `error.associatedItem` references with alias syntax (`@P<n>_<item>`); do not emit bare item names.
  - When producing role-based authorization checks (`role_static_id` predicates or `isInRoleOrGroup`/`isNotInRoleOrGroup`), emit or update `shared-components/acl-roles.apx` in the same run.
  - Normalize all ACL role static IDs to lowercase kebab-case and keep authorization references aligned to declared role IDs.
  - Do not emit authorizations that reference undeclared ACL roles.
  - For `pageItem.sessionState.storage`, emit only `request`, `session`, or `user`.
  - Do not emit `appearance.width` for `selectList`.

Process generation policy — split by process scope (Non‑Negotiable)
- When the draft needs to call a PL/SQL package procedure or function in a page process:
  - MUST prefer:
    - type: invokeApi
    - invoke { package: PKG_NAME procedureOrFunction: PROC_OR_FUNC }
    - One parameter ( ... ) block per argument with explicit direction (in | out | in out) and value mapping:
      - value { item: Pn_ITEM } for item-based values
      - value { type: expression plsqlExpression: ... } for expressions
      - Include parameter { dataType: boolean, hasDefault: true } when required by signature (see login example).
  - MAY emit a thin `type: executeCode` wrapper only when the page process is a page-coupled loader or branch-gated flow that needs direct page-item assignment for reliable runtime behavior.
  - Thin-wrapper blocks must stay small, use named-notation package calls only, and must not re-embed business logic that belongs in the package.
  - For any generated inline PL/SQL body, keep to 4000 or fewer raw characters. If more than 4000 characters are required, extract the logic into a package API (default `app_process_api`) and use `invokeApi` for page processes.
  - For any generated inline SQL body, keep to 4000 or fewer raw characters. If more than 4000 characters are required, move the query into a secure view and have the page artifact reference that view.
  - Treat `aiAgent` tool `settings.sqlQuery` the same way: move prompt-independent logic into secure view(s), keep only a short prompt-aware wrapper inline, and stop with Missing Inputs if the wrapper still exceeds 4000 characters.
  - If DB object naming or verified metadata is missing, emit Missing Inputs instead of inventing package/view definitions.
- When drafting an application process (`appProcess`):
  - MUST emit `type: executeCode`.
  - MUST NOT emit `type: invokeApi`.
  - If packaged logic is required, call the package inside `source.plsqlCode` using named notation.
- Dynamic Content regions:
  - plsqlFunctionBody is permitted for rendering HTML/CLOB (no DML/commit). This policy applies to page processes, not rendering regions.

PL/SQL named notation policy — Non‑Negotiable
- When generating any PL/SQL text (plsqlCode, plsqlFunctionBody, plsqlExpression) with arguments:
  - MUST emit named notation param_name => value for every argument.
  - MUST NOT emit positional or mixed notation.
  - Applies to calls to APEX_*, DBMS_*, UTL_*, and custom packages.
  - Parameterless routines may omit arguments; overloaded routines must always use named notation.

Outputs
- Draft: write only to the transient temp workspace for the run, outside the repo, and do not publish to `applications/<target-app>/...` yet
- When compiler-truth escalation is triggered, emit `Compiler Truth Evidence` immediately before the Generation Plan or draft artifact in the Draft phase response.
- For non-trivial page, component, or application generation, emit `Generation Plan` immediately before the draft artifact in the Draft phase response.
- Parallel contract payload (for critique/revision): `claims`, `required_inputs`, `assumptions`, `source_paths`, `compiler_truth_evidence`, `compiler_truth_report_path`, `generation_plan`.

Governance and invariants (do not duplicate here)
- references/policies/governance/00-governance.md applies globally.
- Critical Pages and Critical Shared Components (runtime-artifact provisioning from `base-app-structure`) are enforced by the orchestrator and by Agent 2/3 gates; this Draft step should not attempt to seed or enumerate files.

Invocation (always constitutional)
- This agent is orchestrated automatically when `SKILL.md` loads `references/workflows/apex-generation.md`.
- No manual activation or deactivation steps are required.
- Token discipline is preserved by keeping this file concise and path-referenced; the master governs minimal rule loading and routing.
- When `server_side_condition.needed = yes`, use only the provided catalog `type` and attributes for each component. If any requested component lacks required attributes, emit a Missing Inputs error instead of guessing. Do not emit conditions when `needed = no`.
- For `itemIsInColonDelimitedList` and `itemIsNotInColonDelimitedList`, emit `list` (not `value`) as the comparison attribute.
- For app/page generation, treat help text planning as default output rather than special-case work. Gather inputs per references/domains/universal-attr-config/reusable-prompts/help_text.md. For each page/item/button target, capture scope, Text Message key or planned key, authoritative source when present, inline help (<=60 chars), detailed help (<=400 chars), localization needs, and rationale. When authoritative content is absent, provisional concise copy is allowed; do not block solely because metadata is missing.
- Generate actually helpful guidance content, not placeholders. Inline help should clarify acceptable input, intent, or format without merely repeating the label. Detailed help should explain why the value matters, key validation or formatting expectations, and any important interpretation notes grounded in the item's source, LOV, validation, and runtime behavior.
- Treat region and report-column comments as default maintainability output on key regions and business-significant, derived, status, or action columns. For in-scope report/grid columns, keep `comments { comments: ... }` as a single string literal that includes the required attributes `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, and `Authorization Scheme`; include `Summary` only when a short leading business-intent sentence materially helps maintenance. When `Summary` is present, keep the stable order `Summary`, `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, `Authorization Scheme`. Mirror executable settings such as `appearance.formatMask` and `security.authorizationScheme` when those blocks are emitted. Hidden technical IDs may skip user-facing guidance but still require comments when they matter to maintenance.
- Comment content must be specific to the column. Derive `Display Label`, report/form visibility, format mask, requiredness, read-only state, primary-display status, and authorization from the emitted DSL, and use `Summary` only when it materially helps maintenance instead of filling space.
- Keep `comments { comments: ... }` metadata separate from NL2IR `genAI.reportContext` / `column.genAI.columnContext`; NL2IR context must follow annotation-first precedence and must not be synthesized from metadata-summary comments.
