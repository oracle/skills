---
templateId: region.interactive-grid.common
componentType: region
version: 1.0
description: Shared contract for interactive grid regions.
---

# Purpose

Standardize variable contracts and guardrails for interactive grid regions.

---

# Generation Rules (MANDATORY)

1. Load `references/policies/memory-bank/30-pages/apex.page.md` and `references/policies/memory-bank/20-data/apex.sql.md` before emitting grid SQL or table-backed grid source definitions.
2. Use `interactive-grid._columns._common.md` for canonical grid column definitions.
3. Use `interactive-grid._saved-report._common.md` for shared saved report structure.
4. Use exactly one Interactive Grid source mode: query-backed (`source.type: sqlQuery` + `source.sqlQuery`) or table-backed (`source.tableName`).
5. When `source.sqlQuery` is used, `source.type: sqlQuery` is mandatory.
6. Use `source.orderByClause` only for table-backed grids, and ensure every identifier in the clause matches a declared Interactive Grid `column` in the same region; hidden columns are valid.
7. For query-backed grids, keep ordering inside `source.sqlQuery`; do not emit `source.orderByClause`, `source.tableName`, or `source.whereClause`.
8. Keep toolbar/download/pagination options declarative and minimal unless explicitly requested.
9. Every Interactive Grid must emit at least one `savedReport` child block. The canonical baseline is `savedReport PRIMARY`.
10. Every Interactive Grid `savedReport` must emit `displayColumn` children; do not use legacy `column (...)` children inside Interactive Grid saved reports.
11. When `singleRowView.displayedColumns: true`, the `displayColumn` list must cover every declared Interactive Grid column except `APEX$ROW_SELECTOR`; include `APEX$ROW_ACTION` whenever the region declares it.
12. Use the active machine-readable schema as the source of truth for Interactive Grid column blocks. Do not emit unsupported column blocks such as `comments` or `appearance` when the current compiler contract rejects them.
13. If the grid adds navigation, ask which mode is required every time: same application page, another application page, or URL redirect.
14. When the chosen mode is same application page and the DSL supports it, emit a declarative page target instead of a URL string.
15. Do not copy Classic Report or Interactive Report column-link syntax into Interactive Grid columns. Treat grid navigation as compiler-gated until the active machine-readable schema identifies a supported hook.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Region static identifier. |
| name | yes | string | Builder display name. |
| type | yes | enum | Always `interactiveGrid`. |
| source.location | yes | enum | `localDatabase`, `restSource`, etc. |
| source.type | conditional | enum | Required and fixed to `sqlQuery` when the grid source is query-backed. |
| source.sqlQuery | conditional | sql | SQL query backing the grid; requires `source.type: sqlQuery`. |
| source.tableName | conditional | string | Table source for table-backed grids; omit for query-backed grids. |
| source.whereClause | optional | sql | Additional where clause for table-backed grids only. |
| source.orderByClause | optional | string | Deterministic order clause for table-backed grids only. |
| source.pageItemsToSubmit | optional | list | Submitted page items. |
| keyColumn | yes | string | Primary key column from query/source. |
| layout.sequence | yes | number | Region order in slot. |
| layout.slot | yes | enum | Usually `BODY`. |
| appearance.template | optional | string | Region template alias. |
| appearance.templateOptions | optional | array | Region template options. Emit only exact accepted values, keep `#DEFAULT#` standalone, and keep documented composites atomic. |
| edit.enabled | optional | boolean | Editable state. |
| edit.allowedOperations | optional | array | Any of `add`, `update`, `delete`. |
| edit.allowedRowOperationsColumn | optional | string | Region-source column that controls per-row update access. Emit only when the request/spec explicitly identifies the control column. |
| pagination.type | yes | enum | `page` or `scroll`. |
| pagination.showTotalCount | optional | boolean | Show total count indicator. |
| performance.lazyLoading | optional | boolean | Lazy loading toggle. |
| componentAppearance.showNullValuesAs | optional | string | Null-display value. |
| messages.whenNoDataFound | optional | string | Empty-state message. |
| toolbar.controls | optional | array | Search/actions/reset/save controls. |
| download.formats | optional | array | `csv`, `excel`, `pdf`, etc. |
| download.csvSeparator | optional | string | CSV separator. |
| download.csvEnclosedBy | optional | string | CSV quote char. |
| download.filename | optional | string | Export filename. |
| componentAdvanced.initJavaScriptFunction | optional | javascript | Interactive Grid initialization callback wrapped in ` ```javascript-browser ` and returning `options`. |
| columns | conditional | list | One or more columns from `interactive-grid._columns._common.md`. |
| savedReports | yes | list | Saved report blocks from `interactive-grid._saved-report._common.md`. Emit at least one; the canonical baseline is `savedReport PRIMARY`. |
| savedReport.singleRowView.displayedColumns | optional | boolean | When `true`, declare `displayColumn` entries for all eligible grid columns. |
| savedReport.displayColumn[] | required when `savedReport` is emitted | array | Saved-report column aliases and sequences for the grid and single-row view. |

---

# Output Template – Full

## Query-Backed Output Template

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: interactiveGrid
  source {
    location: {{source.location}}
    type: sqlQuery
    sqlQuery:
      ```sql
      {{source.sqlQuery}}
      ```
    pageItemsToSubmit: {{source.pageItemsToSubmit}}
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: {{appearance.template}}
    templateOptions: {{appearance.templateOptions}}
  }
  edit {
    enabled: {{edit.enabled}}
    allowedOperations: {{edit.allowedOperations}}
    allowedRowOperationsColumn: {{edit.allowedRowOperationsColumn}}
  }
  performance {
    lazyLoading: {{performance.lazyLoading}}
  }
  componentAppearance {
    showNullValuesAs: {{componentAppearance.showNullValuesAs}}
  }
  messages {
    whenNoDataFound: {{messages.whenNoDataFound}}
  }
  pagination {
    type: {{pagination.type}}
    showTotalCount: {{pagination.showTotalCount}}
  }
  toolbar {
    controls: {{toolbar.controls}}
  }
  download {
    formats: {{download.formats}}
    csvSeparator: {{download.csvSeparator}}
    csvEnclosedBy: {{download.csvEnclosedBy}}
    filename: {{download.filename}}
  }
  componentAdvanced {
    initJavaScriptFunction:
      ```javascript-browser
      {{componentAdvanced.initJavaScriptFunction}}
      ```
  }

  {{savedReports}}

  {{columns}}
)
```

## Table-Backed Output Template

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: interactiveGrid
  source {
    location: {{source.location}}
    tableName: {{source.tableName}}
    whereClause:
      ```sql
      {{source.whereClause}}
      ```
    orderByClause: {{source.orderByClause}}
    pageItemsToSubmit: {{source.pageItemsToSubmit}}
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: {{appearance.template}}
    templateOptions: {{appearance.templateOptions}}
  }
  edit {
    enabled: {{edit.enabled}}
    allowedOperations: {{edit.allowedOperations}}
    allowedRowOperationsColumn: {{edit.allowedRowOperationsColumn}}
  }
  performance {
    lazyLoading: {{performance.lazyLoading}}
  }
  componentAppearance {
    showNullValuesAs: {{componentAppearance.showNullValuesAs}}
  }
  messages {
    whenNoDataFound: {{messages.whenNoDataFound}}
  }
  pagination {
    type: {{pagination.type}}
    showTotalCount: {{pagination.showTotalCount}}
  }
  toolbar {
    controls: {{toolbar.controls}}
  }
  download {
    formats: {{download.formats}}
    csvSeparator: {{download.csvSeparator}}
    csvEnclosedBy: {{download.csvEnclosedBy}}
    filename: {{download.filename}}
  }
  componentAdvanced {
    initJavaScriptFunction:
      ```javascript-browser
      {{componentAdvanced.initJavaScriptFunction}}
      ```
  }

  {{savedReports}}

  {{columns}}
)
```

---

# Mandatory Rendering Rules

- Emit exactly one source-mode template.
- Emit at least one `savedReport` block. The default emitted shape is `savedReport PRIMARY`.
- Expand `{{columns}}` using `interactive-grid._columns._common.md`.
- Expand `{{savedReports}}` using `interactive-grid._saved-report._common.md`.

---

# Conditional Rendering Rules

- For query-backed grids, render `type: sqlQuery` and `sqlQuery` only; omit `tableName`, `whereClause`, and `orderByClause`.
- For table-backed grids, render `tableName` and any optional `whereClause`/`orderByClause`; omit `type` and `sqlQuery`.
- Omit `edit`, `performance`, `componentAppearance`, `messages`, `pagination`, `toolbar`, `download`, and `componentAdvanced` blocks when not required.
- Omit `edit.allowedRowOperationsColumn` unless the request/spec explicitly identifies the control column.

---

# Guardrails

- Do not enable edit mode without a valid key column and matching row processing strategy.
- When `edit.allowedRowOperationsColumn` is present, its value must match a column exposed by the region source and declared in the Interactive Grid column list, typically as a hidden control column.
- Do not infer `edit.allowedRowOperationsColumn` from naming patterns or table semantics; emit it only when the request/spec explicitly identifies the control column.
- Treat `edit.allowedRowOperationsColumn` as an update gate: `U` means the row is editable for update, and any other value means the row is not updatable.
- When `source.sqlQuery` is present, `source.type: sqlQuery` must also be present and `source.tableName`, `source.whereClause`, and `source.orderByClause` must be omitted.
- When `source.tableName` is present, `source.sqlQuery` and `source.type` must be omitted.
- Every `source.orderByClause` identifier must map to a declared Interactive Grid `column` in the same region; hidden columns are valid sort keys, and `source.orderByClause` is valid only for table-backed grids.
- Do not use raw SQL expressions, functions, or undeclared columns in `source.orderByClause`; expressions such as `nvl(...)` belong inside `source.sqlQuery`.
- Prefer declarative same-app page targets for grid navigation whenever the DSL supports them; reserve URL strings for explicit URL mode or component contracts that genuinely require them.
- Use `componentAdvanced.initJavaScriptFunction` only when declarative settings cannot express required behavior.
- Keep custom JS CSP-safe, scoped to grid behavior, and ensure the callback returns `options`.
- Do not treat older prose examples as authority for unsupported Interactive Grid column blocks. If the active schema disallows a column-level `appearance` or `comments` block, do not emit it.
- Fail drafts that omit `savedReport` entirely; Interactive Grid output must include at least one `savedReport` child block.
- Do not emit `savedReport` without `displayColumn` children; Interactive Grid saved reports must use `displayColumn`, not legacy `column`, to control visible grid and single-row columns.
- If `singleRowView.displayedColumns: true`, ensure the saved-report display list covers every declared Interactive Grid column except `APEX$ROW_SELECTOR`; if `APEX$ROW_ACTION` is declared, it must also appear in the display list.
