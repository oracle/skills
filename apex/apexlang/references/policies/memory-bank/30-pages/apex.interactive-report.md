# Interactive Report Page Standards

### Purpose
- Define deterministic layout and configuration for Interactive Report pages.

### Rules (Non-Negotiable)
1. Use `pageTemplate: @/standard` with `templateOptions: #DEFAULT#`.
2. Main region must be `type: interactiveReport` with `appearance.template: @/interactive-report` and `componentAppearance.template: @/standard`.
3. Default pagination is `rowRangesXToY`; include `messages.whenNoDataFound`, align numeric columns to `end`, and override the pagination type only when the user prompts for a catalog option listed in `20-data/apex.sql.md`.
4. Apply navigation/breadcrumb requirements from `apex.page.md`.
5. When report navigation is added or changed, ask every time which link mode is required: same application page, another application page, or URL redirect.
6. For same-application navigation, prefer declarative page targets when the DSL supports them; do not default to `type: url`, `f?p=...`, or SQL-computed URL columns.
7. Every Interactive Report `column (...)` must define `heading { heading: ... }`, including hidden technical ID columns. Hiding a column does not waive the required structural heading metadata.
8. Every projected SQL column must have a matching Interactive Report `column (...)` definition before finals. Do not rely on implicit generated columns for delivered artifacts.
9. If the report SQL references same-page page-item binds, emit `source.pageItemsToSubmit` with those exact item names so refreshes use current context.

### Guidance
- Follow `templates/page-examples/interactive-report-page/interactive-report-page._index.md` for canonical column definitions, filter options, and toolbar settings.
- Keep `appearance.templateOptions` to exact accepted values only. `#DEFAULT#` is a standalone entry, documented caller-facing tokens stay unsuffixed, and documented composites such as hidden-header pairs remain one atomic value.
- Make the primary-key decision explicit:
  - when row navigation or row identity is intended, keep the PK column and wire the navigation declaratively
  - otherwise hide the PK column with `type: hidden`, while still keeping the required `heading { heading: ... }`
- Keep column aliases uppercase.
- Do not emit `reportColumnQueryId` or `derivedColumn` for interactive report columns; those attributes belong to classic report columns only in this repository contract.
- Use friendly display names for headings and apply format masks via the `appearance` block.
- Follow `references/policies/memory-bank/30-pages/apex.report-column-rendering.md` for SQL data-only behavior and column formatting markup placement.
- When linking to a page in the same application, use declarative page-target syntax at the region or column level when supported. If the target page is modal, the parent page must include an `apexafterclosedialog` dynamic action that refreshes the originating report region via `templates/business-logic/dynamic-actions/dynamic-actions.refresh-region-after-dialog.md`.
- Interactive reports should include a default guidance layer. Provide concise user-facing guidance for business-significant columns and all derived, status, and action columns using the supported guidance hook in the selected template family; when the runtime shape has no dedicated column-help hook, surface that guidance in page or region help.
- Parent-child child reports must bind to the hidden parent context item and list that item in `source.pageItemsToSubmit`; parent-context create/edit buttons should be placed in the report toolbar slot such as `rightOfInteractiveReportSearchBar`.

### Filtering With Page Items
- When an Interactive Report uses page-item-driven text search or filtering, normalize both sides of user-entered text predicates with `LOWER()` for `=` / `!=` / `LIKE`.
- Canonical examples:
  ```sql
  where (:P3_SEARCH is null
     or lower(e.ename) like '%' || lower(:P3_SEARCH) || '%')
  ```
  ```sql
  where lower(e.job) = lower(:P3_JOB)
  ```
- Non-compliant examples:
  ```sql
  where e.ename like '%' || :P3_SEARCH || '%'
  ```
  ```sql
  where upper(e.ename) like '%' || upper(:P3_SEARCH) || '%'
  ```


### Example Query
```sql
select empno,
       ename,
       job,
       mgr,
       hiredate,
       sal,
       comm,
       deptno
  from emp
```

- Include `comments { comments: ... }` by default on key IR columns as descriptive metadata describing SQL projection, display behavior, reuse intent, and whether the wording is provisional or sourced. Require the attributes `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, and `Authorization Scheme`; include `Summary` only when a short leading business-intent sentence materially helps maintenance. When `Summary` is present, keep the field order `Summary`, `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, `Authorization Scheme`. Mirror executable settings such as `appearance.formatMask` and `security.authorizationScheme` when those blocks are emitted.
- This applies to simple, single-region, or starter interactive reports as well. Keep the copy short, but do not omit the guidance layer because the report is lightweight.
- Hidden technical IDs may skip user-facing guidance, but they must still keep the required `heading { heading: ... }` block. Important technical, derived, status, and action columns still require developer comments.
- Critique should fail when an interactive report column omits the `heading` block or omits `heading.heading`, even when the column is hidden.
- Critique should fail when an interactive report column includes classic-report-only attributes such as `reportColumnQueryId` or `derivedColumn`.
- Critique should fail when SQL projections are missing matching `column (...)` blocks or when same-page bind items are missing from `source.pageItemsToSubmit`.
- Critique should fail when visible business columns, derived columns, status columns, or action columns are left without the expected default guidance or maintainability comments.
- Column-level `security { authorizationScheme: ... }` remains optional and must reference `{your-app-alias}/shared-components/authorizations.apx` when restrictions are required.
