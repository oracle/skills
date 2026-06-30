---
templateId: region.interactive-grid.region
componentType: region
version: 1.0
imports:
  - interactive-grid._common.md
  - interactive-grid._columns._common.md
  - interactive-grid._saved-report._common.md
description: Full interactive grid region contract with optional filtering, downloads, and page styling blocks.
---

# Purpose

Interactive grid region pattern with explicit query-backed and table-backed source modes, reusable saved report/column contracts, and optional display/download/page styling blocks.

---

# Generation Rules (MANDATORY)

1. Load `interactive-grid._common.md`, `interactive-grid._columns._common.md`, and `interactive-grid._saved-report._common.md` before use.
2. Keep source predicates deterministic and schema-valid.
3. Use only needed optional blocks.

---

# Variable Contract

This template inherits the base Interactive Grid contract from `interactive-grid._common.md`.
The table below lists only the additional placeholders surfaced by this fuller region template.

| Name | Required | Type | Notes |
|------|----------|------|-------|
| source.location | yes | enum | Usually `localDatabase`. |
| source.type | optional | enum | Required and fixed to `sqlQuery` for query-backed grids; omit for table-backed grids. |
| source.whereClause | optional | sql | Declarative filter clause for table-backed grids only. |
| source.pageItemsToSubmit | optional | list | Page items submitted during refresh and DML requests. |
| appearance.template | optional | string | Region template reference. |
| appearance.templateOptions | optional | array | Template modifiers such as `#DEFAULT#`. |
| performance.lazyLoading | optional | boolean | Use when deferred loading is desired. |
| componentAppearance.showNullValuesAs | optional | string | Display text for null values. |
| messages.whenNoDataFound | optional | string | Custom empty-state message. |
| download.csvSeparator | optional | string | CSV separator character. |
| download.csvEnclosedBy | optional | string | CSV text qualifier. |
| download.filename | optional | string | Export filename. |
| savedReport.displayColumn[] | required | array | Saved-report column aliases and sequences for the required baseline `savedReport PRIMARY` and any additional saved reports. |
| componentAdvanced.initJavaScriptFunction | optional | javascript | Interactive Grid initialization callback wrapped in ` ```javascript-browser ` and returning `options`. |
| page.borderWidth | optional | number | Page border width for print/export tuning. |
| page.borderColor | optional | string | Page border color value. |

---

## Required Variables

- `regionStaticId`
- `name`
- `source.location`
- `layout.sequence`
- `layout.slot`
- `columns` (from `interactive-grid._columns._common.md`)
- Plus one complete source mode:
- Query-backed: `source.type`, `source.sqlQuery`
- Table-backed: `source.tableName`

## Optional Variables

- `source.whereClause`
- `source.orderByClause`
- `source.pageItemsToSubmit`
- `appearance.template`
- `appearance.templateOptions`
- `edit.enabled`
- `edit.allowedOperations`
- `edit.allowedRowOperationsColumn`
- `performance.lazyLoading`
- `componentAppearance.showNullValuesAs`
- `messages.whenNoDataFound`
- `toolbar.controls`
- `download.*`

---

## Output Template - Query-Backed

```
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
  pagination {
    type: {{pagination.type}}
    showTotalCount: {{pagination.showTotalCount}}
  }
  messages {
    whenNoDataFound: {{messages.whenNoDataFound}}
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
      function(options)
      {
          //add js code here
          return options;
      }
      ```
  }

  savedReport PRIMARY (
    visibility: primary
    view {
      default: grid
    }
    singleRowView {
      displayedColumns: true
    }

    {{savedReportDisplayColumns}}
  )

  {{savedReports}}

  {{interactive-grid._columns._common.md}}

  page {
    borderWidth: {{page.borderWidth}}
    borderColor: {{page.borderColor}}
  }
)
```

## Output Template - Table-Backed

```
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
  pagination {
    type: {{pagination.type}}
    showTotalCount: {{pagination.showTotalCount}}
  }
  messages {
    whenNoDataFound: {{messages.whenNoDataFound}}
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
      function(options)
      {
          //add js code here
          return options;
      }
      ```
  }

  savedReport PRIMARY (
    visibility: primary
    view {
      default: grid
    }
    singleRowView {
      displayedColumns: true
    }

    {{savedReportDisplayColumns}}
  )

  {{savedReports}}

  {{interactive-grid._columns._common.md}}

  page {
    borderWidth: {{page.borderWidth}}
    borderColor: {{page.borderColor}}
  }
)
```

---

# Conditional Rendering Rules

- Apply the base generation rules from `interactive-grid._common.md` before using this fuller region template.
- Emit exactly one source mode.
- For query-backed grids, render `type: sqlQuery` and `sqlQuery`; omit `tableName`, `whereClause`, and `orderByClause`.
- For table-backed grids, render `tableName` and any optional `whereClause`/`orderByClause`; omit `type` and `sqlQuery`.
- Render the baseline `savedReport PRIMARY` plus any additional `{{savedReports}}` using `interactive-grid._saved-report._common.md`.
- Render `{{interactive-grid._columns._common.md}}` using `interactive-grid._columns._common.md`.
- Omit `source.pageItemsToSubmit` when the grid does not depend on declarative page-item filtering.
- Omit `edit.allowedRowOperationsColumn` unless the request/spec explicitly identifies the row-operations control column from the region source.
- Remove optional blocks (`appearance`, `edit`, `performance`, `componentAppearance`, `pagination`, `messages`, `toolbar`, `download`, `page`) when not required.
- Remove `componentAdvanced` when the grid does not need JavaScript initialization behavior.
- Omit `download.csvSeparator`, `download.csvEnclosedBy`, and `download.filename` when download customization is unnecessary.
- Keep `{{interactive-grid-saved-report.md}}` and `{{interactive-grid-columns.md}}` in place when composing the full interactive grid artifact.
- Always emit at least one `savedReport`, using `savedReport PRIMARY` as the default baseline.
- Every Interactive Grid `savedReport` must include `displayColumn` entries for every declared Interactive Grid column except `APEX$ROW_SELECTOR`; include `APEX$ROW_ACTION` when the region declares it.

---

# Guardrails

- Inherit all source, ordering, key-column, and date-picker guardrails from `interactive-grid._common.md`.
- Keep placeholder naming in dotted form (for example, `{{source.whereClause}}` and `{{download.filename}}`) to match adjacent templates.
- `source.orderByClause` is table-backed only.
- `source.type: sqlQuery` is mandatory whenever `source.sqlQuery` is emitted.
- Keep `{{interactive-grid-saved-report.md}}` and `{{interactive-grid-columns.md}}` as composition placeholders rather than replacing them with hardcoded sample content in this file.
- Keep `componentAdvanced.initJavaScriptFunction` wrapped in ` ```javascript-browser ` and return `options` from the callback.
- Interactive Grid saved reports must use `displayColumn` children and `singleRowView.displayedColumns`; do not fall back to legacy `column (...)` or `displayedCols`.
- Treat the active machine-readable schema as authoritative for Interactive Grid columns; do not widen the region examples with unsupported column-level `comments` or `appearance` blocks.
