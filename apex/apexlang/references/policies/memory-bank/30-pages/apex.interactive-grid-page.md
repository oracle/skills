## Interactive Grid Page Standards

### Purpose
- Guarantee Interactive Grid pages ship with consistent layout, processing, and inline edits.

### Rules (Non-Negotiable)
1. Set `pageTemplate: @/standard` with `templateOptions: #DEFAULT#` (per the interactive grid page example).
2. Main region must be `type: interactiveGrid` with `appearance.template: @/standard` and all grid options sourced from `page-examples/interactive-grid/interactive-grid._index.md`.
3. Every Interactive Grid region must include at least one `savedReport` child block. The default emitted shape is `savedReport PRIMARY`.
4. Every Interactive Grid `savedReport` must use `singleRowView.displayedColumns` and explicit `displayColumn` children. Cover every declared Interactive Grid column except `APEX$ROW_SELECTOR`, and include `APEX$ROW_ACTION` whenever the region declares it.
5. Default pagination is `scroll`; use `page` only when inline editing or user requirements call for explicit page-style pagination controls.
6. Enable automatic row processing (`process type: interactiveGridAutomaticRowProcessing`) with named notation and matching primary key items.
7. Define column metadata (dataType, heading alignment, editable properties) consistent with the active machine-readable schema in `assets/component-attributes.json`; do not invent unsupported Interactive Grid column blocks even when older prose examples still mention them.
8. When `source.orderByClause` is used, reference only declared Interactive Grid columns in the same region. Hidden columns are allowed; raw SQL expressions and undeclared columns are not.
9. When Interactive Grid navigation is added or changed, ask every time which link mode is required: same application page, another application page, or URL redirect.
10. For same-application navigation, prefer declarative page targets when the component DSL supports them; do not default to URL-style targets when they are unnecessary.
11. When row-level update protection is required, use `edit.allowedRowOperationsColumn` only if the request/spec explicitly identifies a control column from the region source; declare that column in the grid, usually as hidden.
12. Apply navigation/breadcrumb standards from `apex.page.md` and ensure the grid has a static ID when referenced by dynamic actions.
13. Interactive Grid columns use grid item `type` values and saved-report `displayColumn` metadata. Do not copy Classic Report `type: link`, Classic query-position metadata, or Interactive Report column-link syntax into Interactive Grid columns unless compiler-backed metadata for the active build proves a supported grid navigation hook.

### Guidance
- Follow `templates/page-examples/interactive-grid/interactive-grid._index.md` for column sequencing, toolbar options, and editable settings.
- Use `savedReport PRIMARY` as the baseline emitted contract unless a different named saved report is explicitly required.
- Keep the canonical single-row property name as `displayedColumns`; do not emit legacy `displayedCols`.
- Treat the active compiler/validator behavior as the source of truth for Interactive Grid column blocks. If the machine-readable schema does not allow a column block such as `comments` or `appearance`, surface guidance at the page or region level instead of inventing unsupported DSL.
- Keep grid navigation separate from report-column rendering until compiler-backed metadata identifies the supported grid navigation contract. Saved-report `displayColumn` coverage is display metadata, not link/navigation metadata.
- For table-backed grids, use `source.orderByClause` only with declared Interactive Grid columns. For query-backed grids, keep ordering in `source.sqlQuery` unless the sorted value is projected and declared as a grid column.
- In the v1 row-operations contract, `edit.allowedRowOperationsColumn` gates updates only: `U` means the row is editable for update, and any other value means the row is not updatable.
- Complement with Interactive Report or Form rules when combining grids with additional regions on the same page.
- Follow `references/policies/memory-bank/30-pages/apex.report-column-rendering.md` for SQL data-only behavior and column formatting markup placement when grid columns need styled output.
- Interactive Grids should include a default guidance layer. Provide concise user-facing guidance for business-significant columns and all derived, status, and action columns using the supported guidance hook in the selected template family; when the runtime shape has no dedicated column-help hook, surface that guidance in page or region help.

### Filtering with Page Items
- Use `templates/region-components/interactive-grid/interactive-grid._common.md` for the region contract and pair filter controls with the matching item templates (for text search, `templates/items/text-field/text-field._index.md`; for select-list and date filters, `templates/items/select-list/select-list._index.md` and `templates/items/date-picker/date-picker._index.md`).
- When demonstrating filtering patterns, include bind predicates in `source.sqlQuery` or `source.whereClause` with deterministic ordering. Example predicate:
  ```sql
  where (:P3_SEARCH is null
     or upper(employee_name) like '%' || upper(:P3_SEARCH) || '%'
     or upper(department) like '%' || upper(:P3_SEARCH) || '%')
  order by employee_name
  ```
- Set `pageItemsToSubmit` on the grid region to every filtering item (`P3_SEARCH`, `P3_DEPARTMENT`, `P3_HIRE_DATE_FROM`) so the bind values are sent with each refresh.
- Create page-level filter items in a dedicated container region, follow naming conventions (`P[page]_[name]`), and reference `40-components/apex.items.md` for supported item attributes.
- Reuse `templates/business-logic/dynamic-actions/dynamic-actions.refresh-region-on-change.md` so item changes refresh the target grid declaratively; use `keyup` for live text search and `change` for select-list or date-driven filters.
- Keep page-item filtering orthogonal to grid mechanics: do not change `keyColumn`, do not remove the matching `primaryKey: true` column definition, and do not alter editable-row behavior or ARP request guards solely to support filtering.
- Native toolbar search and column `columnFilter` remain valid and should continue to be used where appropriate; page-item filtering is for business-driven search, reusable cross-region filters, or default scoping requirements.

### Process Guidance
- Use `process interactiveGridAutomaticRowProcessing` from the template to handle DML; do not substitute custom PL/SQL unless invoking a dedicated API.
- Hidden technical IDs may skip user-facing guidance, but important technical, derived, status, and action columns still require either supported column metadata or page/region help text.
- Column-level `security { authorizationScheme: ... }` is optional and must reference `{your-app-alias}/shared-components/authorizations.apx` when visibility is restricted.
