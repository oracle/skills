# Page Standards

## Purpose
Defines naming, navigation, and hierarchy rules for creating new Oracle APEX pages.
These standards ensure all pages follow consistent structure and navigation behavior.

## Page skeleton and block order
- Required order for page objects:
  1) appearance
  2) nav
  3) css (conditional; only when a CSS exists under #APP_FILES#css/*.css and governance requires inclusion)
  4) security
  5) regions/items/buttons/processes in canonical order per templates
- CSS placement:
  - The css block must appear immediately after nav and before security.
  - The css block must use:
    css {
        fileUrls: #APP_FILES#css/CUSTOM_FILE_NAME.css
    }
  - Do not include css when no CSS file is present or when no deterministic selection is provided; Critique records Missing Inputs instead of guessing.
- JavaScript placement:
  - Approved fields only:
    - js.functionAndGlobalVarDeclaration (namespace globals, e.g., var APP = APP || {};)
    - js.executeWhenPageLoads (minimal, idempotent logic; prefer Dynamic Actions for UI behavior)
  - Prohibited:
    - eval/new Function
    - Inline HTML event handlers (onclick, onload, etc.)
    - External URLs; all assets must be served from #APP_FILES# or Theme Files
- Global page (Page 0) specifics:
  - Keep global JS minimal and idempotent; avoid heavy logic.
  - If runtime template omits nav, templates may include a minimal nav to keep css placement deterministic.

---

- Global page DSL must exactly mirror `templates/page-examples/global_page_0/global_page_0._index.md`; do not emit `appearance`, `templateOptions`, or other attributes unless governance explicitly adds them to the template.

---

## Navigation Rules
1. **Navigation List Entry**
   - For every new **non-modal** page, add a corresponding entry to:
     ```
     /shared-components/lists.apx
     ```
   - Ensure naming consistency and logical placement in the navigation hierarchy.
   - Parent entries that contain children must not define a direct link block; only child entries carry links.

2. **Breadcrumb Entry**
   - For every new **non-modal** page, add a breadcrumb entry in:
     ```
     /shared-components/breadcrumbs.apx
     ```
   - Only include entries for pages that actually exist.
   - For form/modal pages, pass the primary key item in the target (e.g., P[PAGE]_ID:&P[PAGE]_ID.).
   - Sequence numbers should be logical and incremental.
   - Maintain the correct breadcrumb hierarchy relative to parent pages.

3. **Page 0 (Global Page)**
   - Page 0 (`p00000-global-page.apx`) MUST remain the canonical minimal skeleton unless a user explicitly requests global components intended to render on **all** pages.
   - Do **not** emit `security`, `authorizationScheme`, `authentication`, `pageAccessProtection`, `formAutoComplete`, page authorization, or page-level session/security properties on Page 0.
   - If a validator, generator, or template requests normal non-login page security on Page 0, the validator/generator/template is wrong. Fix that source; do not mutate Page 0 to satisfy it.
   - Hidden page items on Page 0 remain subject to hidden-item SSP only when they are explicitly and intentionally added as global items.

---

## Page Grouping
- The correct page-level grouping key is `pageGroup` and it MUST BE SET AT THE PAGE ROOT.
- Do not use `group` at page scope; `group` is reserved for region/item grouping inside component templates (e.g., interactive report column groups).
- Reference groups declared in the target application artifact (for example, `{target_root}/application.apx`) for whole-application runs.

Example (page root with `pageGroup`):
```plaintext
page 42 (
    name: Records
    alias: RECORDS
    title: Records
    pageGroup: @administration
    ...
)
```

Navigation and Breadcrumb DSL patterns (non-modal pages)
- Navigation Menu entry (shared-components/lists.apx):
```plaintext
list navigation-menu (
  ...
  entry records (
    label: Records
    layout { sequence: 20 }
    link { target: f?p=&APP_ID.:42:&APP_SESSION.::&DEBUG.::: }
  )
)
```
- Breadcrumbs entry (shared-components/breadcrumbs.apx):
```plaintext
breadcrumb breadcrumb (
  ...
  entry records (
    name: Records
    pageNumber: 42
    appearance {
      parentEntry: @home
    }
    execution {
      sequence: 20
    }
    link {
      target: f?p=&APP_ID.:42:&APP_SESSION.::&DEBUG.:::
    }
  )
)
```
- Breadcrumb entry validity:
  - `parentEntry` is valid only inside `appearance {}`.
  - `execution { parentEntry: ... }` is invalid.

Critique Gate — Navigation & Grouping (non-modal)
- If grouping is requested, `pageGroup` must appear at the page root; `group` used at page root is FORBIDDEN and must be replaced with `pageGroup` as the parameter name (non-negotiable).
- Navigation Menu: shared-components/lists.apx must include an entry targeting f?p=&APP_ID.:&PAGE_ID.:&APP_SESSION.::&DEBUG.::: for the new page.
- Breadcrumbs: shared-components/breadcrumbs.apx must include a matching entry for the new page.
- Missing entries or misuse of `group` at page root must be flagged as failures.

### Breadcrumb / Title Bar Region Resolution
- The primary header region rendered in the title bar occupies `REGION_POSITION_01` (often a staticContent hero that hosts the breadcrumb).
- When a user prompt requests placing buttons “in the breadcrumb” or “title bar”, locate the actual region assigned to `REGION_POSITION_01` and reference its static ID in `layout.region` (e.g., `@test-application`). Do not assume an alias like `@breadcrumb` exists unless explicitly created.
- Avoid creating duplicate button container regions in the header; reuse the existing hero/breadcrumb region per apex.buttons.md.

## Naming Conventions
1. **Page File Naming**
   - Use the following format for all APEX page files:
     ```
     p[page_number].apx
     ```
     Example: `p00001.apx`, `p00002.apx`
   - Zero-padding ensures consistent sorting and file naming across projects.

2. **Internal References**
   - When referring to page-level components, use the **page number prefix**:
     ```
     P[page_number]_[item_name]
     ```
     Example: `P3_NAME`, `P5_TITLE`

---


## Modal Drawer/Page Policy
- When `appearance.pageMode: modalDialog`, do not set `pageTemplate`. Only `dialogTemplate` is required.
- `appearance.dialogTemplate` MUST use a canonical alias from templates/theme defaults only: `@/modal-dialog`, `@/drawer`, or `@/wizard-modal-dialog`.
- `@/modal` is invalid and must be rejected by critique.
- Navigation and breadcrumb entries for modal pages should use `serverSideCondition: never` unless explicitly displayed.

## Server-Side Execution — invokeApi Preferred with Thin Wrapper Exception (Non‑Negotiable)
- Page processes that call PL/SQL package procedures/functions MUST use:
  - Prefer `type: invokeApi`
  - Provide `invoke { package: PKG_NAME procedureOrFunction: PROC_OR_FUNC }`
  - Provide one `parameter ( ... )` block per argument with explicit direction (in | out | in out) and value mapping:
    - `value { item: Pn_ITEM }` for item-based values
    - `value { type: expression plsqlExpression: ... }` for expressions
    - Include `parameter { dataType: boolean, hasDefault: true }` when required by the API signature (see login template pattern).
- Allow a thin `type: executeCode` wrapper for packaged routines only when the block is a small named-notation package call plus direct page-item assignment required for a page-coupled loader or before-header branch-gated flow.
- DO NOT use `type: executeCode` to re-embed business logic that belongs in the package; non-compliant wrappers must be flagged by critique (see 00-guard and 20-data/apex.logic.md).
- This section governs page processes only. Application processes (`appProcess`) must use `type: executeCode` per 00-guard and 10-global policies.
- Advisory threshold: if any inline PL/SQL body in page-level artifacts exceeds 4000 raw characters, critique should emit warning `PLSQL_LENGTH_WARN_001` and recommend extracting logic into `app_process_api` (or justified alternative). For processes, the preferred target shape is `type: invokeApi`, with the thin-wrapper exception used only when it is explicitly justified by runtime-safe page-item orchestration.
- Advisory threshold: if any inline SQL body in page-level artifacts exceeds 4000 raw characters, critique should emit warning `SQL_LENGTH_WARN_001` and recommend extracting the query into a secure view that page-level artifacts reference instead of embedding inline.
- Dynamic Content regions may use plsqlFunctionBody for rendering HTML/CLOB; they must not perform DML or manage transactions.

## Linking Patterns
- Interactive Report row links must use #COLUMN# substitution in link targets (see region-components/interactive-report/interactive-report._common.md).
- Cards and content-row regions must use &COLUMN. substitution and define navigation in an action block as shown in the corresponding template.
- For Classic Report, Interactive Report, and Interactive Grid navigation, ask every time which link mode is required:
  - same application page
  - another application page
  - URL redirect
- When the chosen mode is same application page and the component DSL supports it, use declarative page-target syntax instead of `type: url`, `f?p=...`, or SQL-computed `apex_page.get_url(...)`.
- Do not mix syntaxes and avoid trailing backslashes in URLs. Always mirror the template’s pattern.

## Page Alias Convention
- Page aliases should match the descriptive portion of the filename after the page number.
- Examples:
  - p00001-home.apx → alias: HOME
  - p00002-leads-report.apx → alias: LEADS-REPORT
  - p00003-leads-form.apx → alias: LEADS-FORM

## Shared Layout Contract
- Apply `30-pages/apex.layout.md` before choosing region coordinates.
- Treat each layout scope independently: page slot rows, nested `parentRegion` rows, item rows by `layout.region + layout.slot`, and button rows by `layout.region + layout.slot`.
- For equal-width siblings in any scope, use implicit flow:
  - first component in the row: omit `startNewRow`
  - second and later siblings: `startNewRow: false`
  - omit `column` and `columnSpan`
- Each scope gets its own 12-column budget; child spans do not subtract from the parent row budget.
- Use explicit `column` / `columnSpan` only for intentionally asymmetric layouts such as sidebar-main, faceted-search, or parent-child split pages.

## Cards Region Standards (Non‑Negotiable)
- For regions with type: cards:
  - Set appearance.template: cards-container on the Cards region.
  - Do not use @/cards; always use @/cards-container.
  - Use only cards attributes validated by the current compiler contract.
  - `componentAppearance.gridColumns` is optional and may be set only to `2`, `3`, `4`, or `5` when a fixed cards grid is required.
  - Omit `componentAppearance.gridColumns` when cards should auto-determine the column count.
  - When `title.htmlExpression`, `subtitle.htmlExpression`, `body.htmlExpression`, or `secondaryBody.htmlExpression` is emitted, set that same block's `advancedFormatting: true`.
  - Inside cards `title.htmlExpression`, `subtitle.htmlExpression`, `body.htmlExpression`, and `secondaryBody.htmlExpression`, use `&COLUMN.` substitution strings, not `#COLUMN#`. Prefer escaped substitutions such as `&COLUMN!HTML.` for text values.
  - Do not emit report-style pagination or inferred card key properties unless parser-confirmed.
  - Do not emit `performance.maxRowsToProcess` for cards regions unless the cards DSL contract explicitly allows it.
  - Card action links must use &EDIT_LINK (never #EDIT_LINK#).
  - The region SQL must compute EDIT_LINK using apex_page.get_url and expose it:
    ```sql
    apex_page.get_url(
      p_page   => :TARGET_PAGE,
      p_items  => :TARGET_ITEMS,
      p_values => :TARGET_VALUES
    ) as EDIT_LINK
    ```
  - Set action.behavior.target: &EDIT_LINK

## Content Row and Template Components
- Use template components under templates/template-components/* when building cards/content-row style regions.
- Default content-row page/region generation must start from `content-row.report-minimal.md` unless the prompt requests a richer scenario.
- Define explicit column objects for every column present in the SQL select list; names should match the SQL columns exactly (typically uppercase).
- For report-mode Content Row explicit columns, use `source.databaseColumn`; do not use `source.databaseCol`.
- For Content Row, enable avatar rendering with `settings.displayAvatar`.
- For Content Row, keep `plugin-avatar` configuration-only; use it for `type`, `icon`, `initials`, `description`, `shape`, `size`, and `cssClasses`, not for display toggles.
- For Content Row, enable badge rendering with `settings.displayBadge`.
- For Content Row, keep `plugin-badge` configuration-only; use it for `label`, `value`, `state`, `icon`, `displayLabel`, `style`, `shape`, `size`, `position`, and `columnWidth`, not for display toggles.
- For Content Row, badge scenarios use `settings.displayBadge` for visibility and `plugin-badge` for configuration fields such as `label`, `value`, `state`, `icon`, `displayLabel`, `style`, `shape`, `size`, and `position`.
- For Metric Card, do not assume the Content Row helper placement applies. Use `plugin-avatar.displayAvatar` plus `plugin-avatar` configuration for proven avatar scenarios, and use `plugin-badge.displayBadge` plus `plugin-badge` configuration for proven badge scenarios. Still omit Metric Card `settings.displayAvatar` and `settings.displayBadge`.
- Provide an action block for row-level navigation in the position expected by the template; `behavior.targetUrl` parameters must use &COLUMN. substitution for these region types.
- For master-detail parent selection, use a Content Row `action ... (` with `position: fullRowLink` to set the same-page hidden context item from the parent PK, for example `P{page}_{PK}: &PK.`.
- Do not create a visible page-item selector as the primary parent selector when a Content Row master list is present; keep the context page item hidden unless manual selection is explicitly requested.
- Place related create/edit/detail buttons in the child report toolbar slot when the child region is an Interactive Report.
- Action components use parentheses and must close with `)` after nested blocks.
- Mirror the template’s formatting for attributes like htmlExpression and appearance/templateOptions; do not invent alternative literal forms.

## Example
```plaintext
File: p00012.apx
Navigation List: shared-components/lists.apx → “Employee Directory”
Breadcrumbs: shared-components/breadcrumbs.apx → “Home > Employees”
