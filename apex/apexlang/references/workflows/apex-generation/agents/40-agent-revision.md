> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.

# Agent 3 — Revision (Child Workflow)

Purpose
- Apply accepted review notes to produce the final APEXlang artifacts, enforce governance gates, and persist only compact runtime evidence when needed — with minimal token/context usage.

Inputs
- draft_path: path to the app file in the transient temp workspace outside the repo
- critique_path: internal review payload reference for the current run
- target_type
- output_path? (defaults per scope)
- app_root? (when Whole Application scope is active; e.g., applications/app_###/)
- server_side_condition? (structured object from master workflow)

<authority_rules>
- Shared prompt contract: `references/workflows/apexlang/prompt-contracts.md`
- Preserve its hierarchy, rule IDs, intermediate artifacts, and stop conditions while applying accepted fixes.
</authority_rules>

<task_scope>
- Apply accepted critique notes only.
- Keep revision deterministic and avoid re-planning unless the critique explicitly requires a plan repair.
</task_scope>

<generation_plan_contract>
- Preserve the frozen `Generation Plan` when applying accepted notes.
- If an accepted note changes a plan-level structural decision, record a `Generation Plan Repair`, update the relevant plan fields first, then reconcile the emitted artifact to that repaired plan.
- Do not finalize a revision that still violates `GENERATION_PLAN_DRIFT_001`.
</generation_plan_contract>

<output_contract>
- Preserve or refresh `compiler_truth_evidence` when structural revisions change a compiler-justified decision.
- For every accepted validator, VSCode Problems, `problems.json`, or `validation-report.json` issue, use `assets/validator-fix-recipes.json` to record `rule_id`, cause, deterministic fix applied, owning guidance, and rerun verification result.
- Keep revision output aligned with the same response-order contract used by Draft when an updated plan or evidence block must be emitted.
</output_contract>

<stop_conditions>
- Follow `RULES_FIRST_WORKFLOW_REQUIRED_001` and `HUMAN_INTERVENTION_REQUIRED_001`.
- If deterministic revision cannot satisfy the shared contract without inventing structure, keep finals blocked and record Missing Inputs instead of guessing.
</stop_conditions>

Responsibilities (apply only accepted notes)
- Respect governance:
  - Reject any change conflicting with references/policies/memory-bank/00-guard/ai.guard.md or 10-global/apex.global.md.
  - Do not invent attributes or CSS classes; use templates/* only.
  - Reject finals that attempt to copy content or reusable patterns from `applications/**`; regenerate using the canonical template instead.
  - Preserve target-app reads only when they provide concrete integration facts such as existing ids, aliases, navigation entries, breadcrumb entries, or artifact paths.
  - Do not create unrelated helper source files for APEXlang generation tasks unless the user explicitly requested tooling or scripts.
- For dynamic-action revisions, follow `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions.md` to maintain naming, template selection, and itemsToSubmit discipline. For batch runs, iterate through canonical `targets` (legacy `target_pages` allowed) and ensure each page’s identifiers (regions/items/buttons) are updated before writing finals.
- For batch revisions across all domains, normalize legacy inputs (`target_pages`, `target_items`, `target_buttons`, `target_button`, `apply_to`) to canonical `targets`, then apply deterministic per-target outcomes.
- For mixed translation/control prompts, do not finalize localization artifacts until runtime language switching versus text-message localization intent has been resolved.
- Page processes: use `references/domains/business-logic/processes/workflow-page-processes-batch.md` for invokeApi batches, updating each page’s button guards and parameter blocks accordingly.
- Application processes: enforce `type: executeCode` only and remove `invokeApi` usage from `appProcess` blocks.
- Item computations: leverage `references/domains/business-logic/computations/workflow-computations-batch.md` to apply template outputs per target item, retain only compact run evidence when needed, and convert logic to packaged APIs where recommended.
  - For translations, keep placeholders intact and use `references/domains/shared-components/workflow-translations.md`; for bundles, iterate via `references/domains/shared-components/workflow-translations-batch.md`, logging AI-assisted entries separately.
- For button batches, apply `references/domains/page-components/buttons/workflow-button-batch.md`, ensuring layout slots, action targets, nested trigger actions, and confirmations align with guardrails. Persist only compact run evidence when needed.
- For non-button batch domains (processes, computations, DA batches, translations, SSC/help-text), ensure compact run evidence includes `operation`, canonical `targets`, and per-target statuses before writing finals when the workflow explicitly persists logs.
- Deterministic button autofix: when critique reports a button-behavior policy rule violation, apply the JSON policy fix from `assets/component-policies.json` exactly. For `BTN_RULE_001`, remove `warnOnUnsavedChanges` whenever `behavior.action: definedByDynamicAction`.
- Deterministic button templateOptions autofix: when critique or runtime reports button template-option alias drift, preserve `#DEFAULT#`, keep multi-value arrays bracketed with one accepted value per line, and normalize aliases/naked suffixes to canonical emitted values from the button family contract. Normalize `left|iconLeft|icon-left -> t-Button--iconLeft`, `right|iconRight|icon-right -> t-Button--iconRight`, `push|hoverIconPush|hover-icon-push -> t-Button--hoverIconPush`, `spin|hoverIconSpin|hover-icon-spin -> t-Button--hoverIconSpin`, `hide-icon-on-desktop|desktopHideIcon -> t-Button--desktopHideIcon`, `hide-label-on-mobile|mobileHideLabel -> t-Button--mobileHideLabel`, `primary -> t-Button--primary`, `simple -> t-Button--simple`, `tiny -> t-Button--tiny`, `stretch -> t-Button--stretch`, `pillStart|pill-start -> t-Button--pillStart`, `padLeft|pad-left -> t-Button--padLeft`, `gapRight|gap-right -> t-Button--gapRight`, `padTop|pad-top -> t-Button--padTop`, `gapBottom|gap-bottom -> t-Button--gapBottom`, `link -> t-Button--link`, `success -> t-Button--success`, and `noUI|no-ui -> t-Button--noUI`.
- Deterministic icon autofix: for `FA_ICON_REQUIRED_001`, replace non-`fa-*` icon values with conservative Font APEX classes such as `fa-table`, `fa-users`, `fa-map-marker`, `fa-package`, `fa-image`, `fa-filter`, `fa-edit`, or `fa-plus`; do not use Material, JET, image, or custom CSS icon aliases.
- Deterministic Classic Report component templateOptions autofix: for `CLASSIC_REPORT_DEFAULT_TEMPLATE_REQUIRED_001`, set `componentAppearance.templateOptions` to a multi-line array containing exactly `#DEFAULT#`, `t-Report--stretch`, and `t-Report--horizontalBorders`. Remove `t-Report--altRowsDefault`, `t-Report--staticRowColors`, `t-Report--rowHighlight`, and any vertical/no-border report modifiers unless a specific scenario contract explicitly overrides the Classic Report default.
- Deterministic Classic Report contextual-info wrapper autofix: for `CLASSIC_REPORT_CONTEXTUAL_INFO_TEMPLATE_OPTIONS_REQUIRED_001`, keep `appearance.template: @/contextual-info` and set `appearance.templateOptions` to a multi-line array containing exactly `#DEFAULT#`, `t-Region--hideHeader js-addHiddenHeadingRoleDesc`, and `t-Region--noUI`.
- Deterministic dashboard KPI autofix: for `DASHBOARD_KPI_METRIC_CARD_REQUIRED_001`, replace single-value KPI Classic Reports with one normalized `themeTemplateComponent/metricCard` strip using one source row per KPI. Preserve required KPI labels, icons, aggregate SQL values, meta text, and layout row membership.
- Deterministic dashboard row-plan autofix: for `APP_UX_LAYOUT_RECIPE_REQUIRED_001` or `DASHBOARD_LAYOUT_ROW_PLAN_REQUIRED_001`, treat each `layout_row_plan` entry as one physical row. Split stacked full-width detail, contextual summary, and cards sections into separate one-region entries and remove `startNewRow: false` from the first region in each resulting row. Replace any `dashboard-chart-flow` recipe with explicit `two-up-equal` and `three-up-equal` chart row entries.
- Deterministic drawer default autofix: for `DRAWER_POSITION_DEFAULT_END_REQUIRED_001`, add `js-dialog-class-t-Drawer--pullOutEnd` to drawer form `appearance.templateOptions` unless the requirements explicitly specify start/top/bottom or centered dialog behavior.
- Deterministic `.apx` line-ending fix: for `APEXLANG_LF_LINE_ENDINGS_REQUIRED_001`, rewrite only the affected generated or revised `.apx` artifacts with LF line endings before any validation, publish, or handoff.
- Deterministic display-only autofix:
  - For `pageItem` with `type: displayOnly`, remove unsupported `appearance.width` and `appearance.height`.
  - Ensure `settings.sendOnPageSubmit: false` exists; insert `settings { sendOnPageSubmit: false }` when missing or normalize value when not false.
  - Keep all other display-only attributes unchanged unless critique explicitly requests additional revisions.
- Deterministic master-detail Content Row autofix:
  - For `CONTENT_ROW_SETTINGS_SUBSTITUTION_REQUIRED_001`, rewrite Content Row `settings.overline`, `settings.title`, `settings.description`, and `settings.miscellaneous` column mappings from bare aliases to `&COLUMN_NAME.` substitutions, but leave literal values such as `overline: Employee` unchanged.
  - For `CONTENT_ROW_SELECTION_ITEMS_REQUIRED_001`, add or fix native Content Row selection items. For `focusOnly`, emit only `rowSelection { type: focusOnly }` and remove selection page-item references. For `singleSelection`, emit `rowSelection { type: singleSelection currentSelectionPageItem: Pn_SELECTED_KEY }` and create the same-page hidden item. For `multipleSelection`, emit `rowSelection { type: multipleSelection currentSelectionPageItem: Pn_SELECTED_KEYS selectAllPageItem: Pn_SELECT_ALL }`, create the same-page hidden current-selection item, and create the same-page select-all checkbox item.
  - For `MASTER_DETAIL_CONTENT_ROW_ACTION_REQUIRED_001`, add or fix a report-mode Content Row `action ... (` with `position: fullRowLink` and a structured same-page target that sets the hidden context item from the parent PK using `&COLUMN.` substitution. Do not accept native `rowSelection.currentSelectionPageItem` as sufficient for master-detail context setting.
  - For `MASTER_DETAIL_DYNAMIC_ACTION_REQUIRED_001`, remove URL-style same-page reloads from master selection, update the hidden parent context item through dynamic-action/declarative behavior, and refresh every dependent child region after the context changes.
  - For map child context drift, replace `v()`/`nv()` session-state reads with normal `:P...` binds and add explicit child-region refresh behavior. Add map-layer `source.pageItemsToSubmit` only when direct compiler truth for the active build proves it valid for the selected layer shape.
  - For missing map marker edit/open links, add a declarative map layer `link { target: { page, items } }` using the marker key column and target form primary-key item declared in the UX contract.
  - For `MAP_INITIAL_VIEWPORT_BOUNDS_REQUIRED_001`, replace average-center/fixed-zoom `initialPositionAndZoom` with a SQL-derived `boundingBox` using min/max longitude and latitude over the layer dataset, and remove `infiniteMap` from controls when bounding-box metadata is present.
  - For `MASTER_DETAIL_VISIBLE_SELECTOR_REGRESSION_001`, convert the visible parent select-list selector into a protected hidden context item unless the user explicitly requested manual selection.
  - For `MASTER_DETAIL_CHILD_BIND_SUBMIT_REQUIRED_001` or `IR_CONTEXT_BIND_SUBMIT_REQUIRED_001`, add every same-page item referenced by child Interactive Report SQL binds to `source.pageItemsToSubmit`.
  - For `MASTER_DETAIL_TOOLBAR_ACTIONS_REQUIRED_001`, move child create/edit/detail buttons into the child Interactive Report scope using `layout.region: @<child-report-static-id>` and `slot: rightOfInteractiveReportSearchBar`; move primary page-level create buttons to the breadcrumb/title-bar region, usually `layout.region: @breadcrumb` and `slot: NEXT`.
  - For `PARENT_CHILD_ACTION_COVERAGE_REQUIRED_001`, update `.apexlang/app-ux-contract.json` before patching pages: add `actionCoverage` under the relevant `behaviorPlan.parentChildContext` entry for parent edit, child create, child edit/detail, and page-level create behaviors, then materialize those links/buttons in the page artifacts.
  - For `PAGE_ACTION_BREADCRUMB_REQUIRED_001`, move the primary page-level create button from the report/search results region to the breadcrumb/title-bar region, usually `layout.region: @breadcrumb`; keep region toolbar placement only for child/detail actions.
  - For `MASTER_DETAIL_LAYOUT_REQUIRED_001`, use `appearance.pageTemplate: @/standard` and the master-detail Content Row BODY-grid recipe: parent Content Row first in `BODY` with `columnSpan: 3` or `4`, child report second in `BODY` with `startNewRow: false`, and remove redundant child `column` / `columnSpan` unless the validated contract requires them. Do not use `@/left-side-column` or `leftColumn` for master-detail workbenches.
  - For `MASTER_DETAIL_CONTENT_ROW_TEMPLATE_REQUIRED_001`, set the master Content Row region `appearance { template: @/standard templateOptions: #DEFAULT# }`. Do not repair it to `@/blank-with-attributes`; that shell is for structural containers and dashboard KPI strips.
  - For `APP_UX_FORM_VALIDATION_REQUIRED_001`, update `.apexlang/app-ux-contract.json` if needed, then add a page-level validation using the canonical validation templates. Associate the error with the target item and include the controlling item/value condition for conditional requirements.
  - For `APP_UX_FORM_CONTEXT_REQUIRED_001`, convert the context-owned item to `type: hidden` or a hidden-template display state, preserve launcher item mappings, and keep checksum protection appropriate for server-owned context values.
  - For `APP_UX_FORM_DEFAULT_REQUIRED_001`, add an explicit default or dynamic-action set-value behavior that submits the source item, looks up the declared source column, populates the target item, and preserves user override when the requirement allows it.
  - For `FACET_SOURCE_DATA_TYPE_REQUIRED_001`, `FACET_RANGE_DATA_TYPE_REQUIRED_001`, or `FACET_DATE_DATA_TYPE_REQUIRED_001`, set date/time facets such as `ORDER_DATE` or `ORDER_DATETIME` to `source.dataType: date`, set numeric facets to `source.dataType: number`, and remove `source.dataType` from string facets instead of using `varchar2`.
  - For `FACET_LIST_ENTRIES_LIMIT_REQUIRED_001`, add `listEntries.maxDisplayedEntries: 10` to checkbox/radio facets unless requirements justify 5-15. For `FACET_VALUE_FILTER_INITIAL_REQUIRED_001`, add `listEntries.displayFilterInitially: true` to the same `listEntries` block.
  - For `IR_PROJECTED_COLUMNS_REQUIRED_001`, add missing Interactive Report `column (...)` definitions for every SQL projection using `interactive-report._columns._common.md`; preserve numeric end alignment and required headings.
- Deterministic layout autofix:
  - Apply these fixes to generated application artifacts before final validation; app output is not a layout-lint bypass.
  - Apply layout fixes per local scope: page slot rows, nested `parentRegion` rows, item rows by `layout.region + layout.slot`, and button rows by `layout.region + layout.slot`.
  - For equal-width sibling rows, remove `layout.column` and `layout.columnSpan`.
  - Ensure the first component in an equal-width row omits `layout.startNewRow`.
  - Ensure second-and-later equal-width siblings set `layout.startNewRow: false`.
  - Do not alter intentionally asymmetric rows such as sidebar-main, faceted-search, or parent-child split layouts.
  - Finals:
  - Write revised `.apx` outputs only to the transient temp app:
    - Pages → temp `{output_path}/pages/` or `{app_root}/pages/`
    - Shared components → temp `{output_path}/shared-components/` or `{app_root}/shared-components/`
  - Publish into `applications/<target-app>/...` only after the resolved live runtime action succeeds.
- Compact run evidence:
  - Persist a concise list of applied/rejected/deferred notes only when the workflow explicitly stores durable evidence under `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/``.
  - Preserve `compiler-truth-report.json` for generated or revised `.apx` artifacts and block completion when the report is missing or failing.
  - Preserve `validation-report.json`, `validation-transcript.log`, `problems.json`, and `component-contracts/<build>.json` from `runtime validate`. Apply fixes only for reported live validation problems, then rerun `runtime validate` until live APEX validation passes.
  - Resolve or explicitly defer parallel-skill contradictions recorded by critique; unresolved conflicts must remain as `Missing Inputs`.

Navigation, breadcrumb, and page grouping revisions (non-modal)
- When missing, append a Navigation Menu entry under shared-components/lists.apx targeting:
  f?p=&APP_ID.:&PAGE_ID.:&APP_SESSION.::&DEBUG.:::
  Choose a logical sequence number consistent with neighboring entries.
- When missing, append a breadcrumb entry under shared-components/breadcrumbs.apx for the new page.
- For `BREADCRUMB_REGION_TITLE_VISIBLE_GENERIC_001`, rename the page breadcrumb/title-bar region away from generic chrome text such as `Breadcrumb` or `Title Bar`, use the current page title/current breadcrumb entry as the visible region name, keep the title-bar/breadcrumb templates, and use live-valid template options such as standalone `#DEFAULT#`.
- For management/launcher hub media-list entries, add a conservative `fa-*` icon and `userDefinedAttributes { 1: ... }` description when missing; choose semantic icons from the target domain such as `fa-package`, `fa-image`, `fa-filter`, `fa-users`, `fa-map-marker`, `fa-table`, or `fa-sitemap`.
- For shared-components/lists.apx and shared-components/breadcrumbs.apx, normalize `behavior { target: ... }` to `link { target: ... }`.
- For shared-components/component-settings.example.md, normalize direct settings keys to `settings { attributes: {...} }` and preserve existing values.
- When page_group input is provided or inferable, set pageGroup: @your-group at the page root (not inside appearance/nav/css/security).
- Do not emit group at page root; group is only valid within region/item templates and must remain unchanged there.
- Align with references/policies/memory-bank/30-pages/apex.page.md and Tier‑2 orchestration acceptance rules.

- Server-side execution fixes (scope split)
- When critique requires conversion of page-process executeCode package calls, perform these revisions:
  - Replace `type: executeCode` with `type: invokeApi`.
  - Add:
    ```
    invoke {
      package: PKG_NAME
      procedureOrFunction: PROC_OR_FUNC
    }
    ```
  - For each argument, add a `parameter ( ... )` block with explicit `direction` (in | out | in out) and `value` mapping (either `item: Pn_ITEM` or `type: expression` with `plsqlExpression`).
  - Preserve `execution { sequence, point }`, `serverSideCondition`, and any `advanced` attributes.
  - Remove `plsqlCode` content when replaced by `invokeApi`; keep justification comments if present.
- Do not modify anonymous `executeCode` blocks that do not call packages unless critique notes require changes.
- Do not convert a valid thin page-level `executeCode` wrapper to `invokeApi` when critique confirms it is a page-coupled loader or branch-gated flow that needs direct page-item assignment and keeps business logic inside the package.
- When critique flags `appProcess type: invokeApi`, convert to:
  - `type: executeCode`
  - `source { plsqlCode: ```plsql <PKG>.<PROC>(...named notation...); ``` }`
  - Preserve execution, serverSideCondition, security, and config blocks.

Guardrail-driven PL/SQL and DB connection handling
- Resolve `PLSQL_INLINE_BLOCK_001` from `00-guard/ai.guard.md` by removing inline PL/SQL bodies > 4000 raw characters and replacing them with package API usage (`app_process_api` default) plus compliant process type (`invokeApi` for page process, `executeCode` for appProcess).
- Resolve `SQL_INLINE_BLOCK_001` by removing inline SQL bodies > 4000 raw characters, moving the query into a secure view, and rewriting the page/region/LOV/computation to reference that view.
- Resolve oversized `aiAgent` tool `settings.sqlQuery` the same way: move prompt-independent joins, aggregations, and normalization into secure view(s), then keep only a short prompt-aware wrapper query inline.
- Resolve calendar vocabulary drift deterministically: remove unsupported calendar settings such as `showTime`, normalize calendar settings to the canonical long-form names (`displayColumn`, `startDateColumn`, `endDateColumn`, `pkColumn`), restrict `additionalCalendarViews` to `list` and `navigation`, and collapse combined header tokens such as `t-Region--hideHeader js-addHiddenHeadingRoleDesc` into one `templateOptions` value. Record the source template/example as defective when critique or runtime flags the drift.
- Resolve Interactive Grid saved-report metadata drift deterministically:
  - remove explicit chart sort `LABEL` values when they only restate metadata-backed default behavior
  - preserve metadata-backed aggregate view/static-id fields when they are part of the accepted contract instead of stripping them as ignored parameters
- Resolve calendar link drift deterministically: rewrite legacy string `settings.createLink` / `settings.viewEditLink` examples to structured object syntax only when the accepted inputs explicitly provide the target page and any required item mappings. If critique reports invented target pages or item names, remove the guessed values and keep the artifact blocked with Missing Inputs guidance instead of inventing replacements.
- If deterministic package/view naming or verified metadata is missing, keep finals blocked and record Missing Inputs rather than inventing DB objects.
- Resolve `DB_CONN_REQUIRED_001` from `00-guard/ai.guard.md` by requesting `db_connection_name` before any DB object creation/update; if still missing, block DB-object finals and keep the item in Missing Inputs/Required Revisions.
- Preserve `compiler_truth_evidence` from the draft/critique payload whenever revision rewrites a structure justified by compiler truth.
- If revision changes a non-exact-match structural decision, refresh the affected `compiler_truth_evidence` entry before finalizing; do not keep stale conclusions attached to a rewritten shape.
- Preserve `generation_plan` from the draft/critique payload whenever revision keeps the same structural decision set.
- If revision changes a non-trivial structural decision, refresh the affected `generation_plan` fields before finalizing; do not keep stale plan decisions attached to a rewritten artifact.

SQL hygiene and pagination (Required Revisions)
- ACL role declaration autofix:
  - When critique reports `ACL_ROLE_DECLARATION_REQUIRED_001`, create `shared-components/acl-roles.apx` when absent.
  - Add missing ACL role declarations for every referenced role.
  - Normalize declared and referenced ACL role static IDs to lowercase kebab-case.
  - Rewrite authorization references to the normalized role IDs so authorizations and roles artifact remain consistent.
- For region SQL sources and any fenced SQL in templates:
  - If `SELECT *` is present, do not attempt to expand columns automatically; record a Required Revision to project explicit columns per 20-data/apex.sql.md.
  - If deterministic ordering is missing for paginated regions, record a Required Revision to add ordering aligned with displayed columns.
  - For SQL-backed template components, remove `ORDER BY` from `source.sqlQuery` and add top-level `orderBy {}`. Use `type: staticValue` with `orderByClause` unless a same-page item intentionally controls ordering with `type: item`.
  - If report SQL/PLSQL contains HTML literals for UI rendering, remove markup from SQL/PLSQL and move presentation logic to `columnFormatting.htmlExpression` per `references/policies/memory-bank/30-pages/apex.report-column-rendering.md` (`REPORT_SQL_HTML_LITERAL_FORBIDDEN_001`).
  - When a report column uses `columnFormatting.htmlExpression`, normalize away `type: richText` and keep plain text type implicit unless a non-default type is explicitly required.
  - If SQL/PLSQL `WHERE` predicates compare columns ending with `_static_id` without LOWER normalization, rewrite deterministically to canonical form per `STATIC_ID_WHERE_LOWER_REQUIRED_001`:
    - `lower(col_static_id) = lower(<value_or_bind>)`
    - `lower(col_static_id) != lower(<value_or_bind>)`
    - `lower(col_static_id) in ('lowercase','values')`
  - If Interactive Report SQL uses user-entered text predicates without `LOWER()` normalization on both sides, rewrite deterministically to canonical form per `IR_TEXT_SEARCH_CASE_NORMALIZATION_REQUIRED_001`:
    - `col = :PXX_ITEM` -> `lower(col) = lower(:PXX_ITEM)`
    - `col like '%' || :PXX_SEARCH || '%'` -> `lower(col) like '%' || lower(:PXX_SEARCH) || '%'`
- If no pagination/row limit is configured, record a Required Revision to enable pagination and set sensible `maxRowsToProcess`; avoid unbounded sets.
- If pagination type is missing or outside the region-specific catalog in `20-data/apex.sql.md` without user direction, record a Required Revision to align with the catalog and document the chosen type:
  - Classic Report default: `rowRangesXToYNoPagination`
  - Interactive Report default: `rowRangesXToY`
  - Interactive Grid default: `scroll`
- When critique reports same-application report/grid navigation implemented as `type: url`, `f?p=...`, or SQL-generated URL columns, rewrite it to declarative page-target syntax whenever the accepted inputs identify the target page and item mapping and the DSL supports that target shape.
- When critique reports a `redirectThisApp` button implemented as scalar `target: f?p=...` or bare `target { ... }`, rewrite it to a declarative `target: { page, items, clearCache, action, request }` object whenever the target page and item mapping are known.
- Resolve SSC tokens by expanding them into catalog-compliant conditions (per 20-data/apex.logic.md) and annotate finals with a comment referencing the token origin. When expanding `plsqlExpression` conditions, enforce the guardrails in section 8 (bind syntax, null safety, no DML/dynamic SQL, approved patterns). Record Missing Inputs or Required Revisions when proposals violate these rules, and include both the one-line intent and validated expression in draft summaries. If the token is unknown, record Missing Inputs and do not guess. For batch SSC runs, do not apply finals automatically; keep the affected targets in compact run evidence when that workflow persists logs.
  - For `itemIsInColonDelimitedList` and `itemIsNotInColonDelimitedList`, normalize legacy `value` to `list` during revision. Emit `list` in finals and keep `value` only as migration input.
  - If SQL hints are detected, record a Required Revision to remove them.
  - Enforce table aliases and leading‑comma formatting (one column per line); record Required Revisions where violated.
- Do not rewrite queries without schema context; prefer emitting Required Revisions with clear, actionable notes referencing 20-data/apex.sql.md and 10-global/apex.global.md.

PL/SQL named notation compliance
- For PL/SQL text blocks (plsqlCode, plsqlFunctionBody, plsqlExpression):
  - Do not auto-convert positional to named notation unless a trusted signature catalog is available.
  - Emit Required Revisions listing each offending call and a suggested rewrite using named notation (param_name => value) for every argument.
  - Parameterless calls "()" are acceptable and require no changes.

Governance gates (existence checks with minimal tokens)
- Critical Pages (always):
  - Ensure presence of Page 0 (`p00000-*.apx`), Page 1 (`p00001-*.apx`), and Page 9999 (`p09999-*.apx`) under the correct pages/ directory.
  - If missing, create from:
    - templates/page-examples/global_page_0/global_page_0._index.md
    - templates/page-examples/home-page/home-page._index.md
    - templates/page-examples/login-page/login-page._index.md
- Critical Shared Components (Whole Application only):
  - Ensure {app_root}/shared-components/ exists and is populated.
  - If missing or empty, seed from:
    - Source: templates/base-app-structure/scaffold-example/shared-components/**
    - Target: {app_root}/shared-components/**
  - Keep token usage minimal: refer by glob paths; do not enumerate files.
  - Remove documentation-only placeholders inherited from `base-app-structure/` unless the run explicitly requires those values.
  - Mandatory cleanup: remove leaked template-family files from the transient app root before finals, including `README.md`, `base-app-structure._common.md`, `base-app-structure._index.md`, and `base-app-structure.registry.json`.
  - Mandatory cleanup: remove leaked template-family docs from the transient app root before finals.
  - Mandatory cleanup: if the transient app root contains top-level entries outside `.apex/`, `application.apx`, `deployments/`, `page-groups.apx`, `pages/`, `shared-components/`, and `supporting-objects/`, remove the leaked scaffold/template entries instead of carrying them into published output.

Loop cap and scoring (honor Critique policy)
- Read PASS and CONFIDENCE from the structured review payload for the current run:
  - PASS: 1|2
  - CONFIDENCE: 0.00–1.00 (numeric)
- If CONFIDENCE < 0.95 and PASS = 1 → perform one additional generate -> review -> fix pass (the master sets next PASS=2).
- If PASS = 2 → stop after this revision; if CONFIDENCE < 0.95 record outstanding issues and do not loop again.
- When a workflow explicitly stores durable run evidence, ensure the compact record includes:
  - PASS: <value from critique>
  - CONFIDENCE: <value from critique>
  - For styling-owned runs, include the chosen implementation path, official-reference status, theme-mode evidence path, token/class audit, CSS attachment and cache-busting, and required visual-gate coverage.
- After two passes (max), stop and record outstanding issues regardless of confidence.

Import runtime gate reconciliation
- If run evidence does not show prerequisite metadata source was resolved first, block completion and record `DB_MODE_PROMPT_REQUIRED_001` in compact run evidence.
- If run evidence does not show a passing compiler-truth audit for the staged app path, block completion and record `COMPILER_TRUTH_EVIDENCE_REQUIRED_001` or `COMPILER_TRUTH_AUDIT_FAILED_001` before runtime handoff.
- For online runs, require direct SQLcl success for `apex validate -input <resolved_app_path>` before marking completion.
- If the post-check GUI choice resolves to import, also require direct SQLcl import success for the same `resolved_app_path` in the same authenticated SQLcl user session; otherwise record `ONLINE_IMPORT_CONDITIONAL_001`.
- If local predeploy validation or direct SQLcl roundtrip output reports failure, apply deterministic fixes only for reported issues:
  - vocabulary compatibility failures -> normalize only to canonical `26.1.0+3102` vocabulary by running `node tools/apexctl.mjs apexlang validate --app-path <resolved_app_path> --fix-vocab`, persist report path ``APEXLANG_OUTPUT_ROOT/logs/apexlang-vocab-report.json``, and keep completion blocked until unresolved aliases are zero.
  - schema contract failures -> prioritize compiler-truth-backed DSL rewrites first; use `assets/component-attributes.json` only as fallback/internal validator context when stronger runtime-backed proof is unavailable.
  - SQLcl not found -> request a working SQLcl installation on PATH; do not guess command locations.
  - SQLcl validate/import failures -> record actionable revisions and preserve failing command output context in compact run evidence.
- For runtime/import failures, the master may run up to 2 additional live retries after the first failure (3 total live rounds), but each retry must follow a fix -> local DSL validation -> live rerun sequence.
- Do not mark run complete until runtime gate passes or retries are exhausted (`RUNTIME_GATE_COMPLETION_REQUIRED_001`).
- Do not mark `validate-and-import` runs complete until import execution success is recorded (`ONLINE_IMPORT_CONDITIONAL_001`).

Notes
- Keep tokens low by referencing paths and rules; avoid quoting large portions of the draft or critique.
- Prefer declarative validations/processes; push heavy logic to DB packages/views; guard DML by button/process.
- When server-side conditions are requested, ensure finals align with the provided scope, type, and attributes; do not invent or alter conditions without updated inputs. Emit Missing Inputs if data was not supplied by the workflow.
- Help text and annotation enforcement: apply the guardrails from 10-global/apex.global.md, 30-pages/apex.form.md, 30-pages/apex.classic-report.md, 30-pages/apex.interactive-report.md, 30-pages/apex.interactive-grid-page.md, and 40-components/apex.items.md. Ensure the default guidance layer is present: page help on major pages, concise help on user-editable and filter/control items, and developer comments on key report columns and high-value regions. Use Text Messages, planned message keys, or approved sources, respect length limits (inline <=60 chars; detailed <=400 chars), and keep draft/apply state in compact run evidence when batch workflows persist logs. Convert uncontrolled literals to Text Message references before finals; otherwise record Required Revisions.
- When guidance is missing and inputs are otherwise sufficient, auto-revise the draft to add helpful page help, item help, and column comments rather than leaving the issue as advisory. Replace placeholders and label-only restatements with concise, behavior-aware wording derived from authoritative metadata first, then from emitted labels, validation, LOV semantics, format masks, and source-column purpose.
- For report/grid column metadata, preserve the existing `comments { comments: ... }` shape. Do not invent alternate annotation blocks. When revising comments, keep the required attributes `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, and `Authorization Scheme`; include `Summary` only when a short leading business-intent sentence materially helps maintenance, and mirror executable settings such as `appearance.formatMask` and `security.authorizationScheme` when present.

Invocation (always constitutional)
- This agent is orchestrated automatically when `SKILL.md` loads `references/workflows/apex-generation.md`.
- No manual activation or deactivation steps are required.
- The master governs minimal rule loading and routing; this file remains concise and path‑referenced.
