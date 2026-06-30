---
templateId: region.interactive-grid.standard
componentType: region
version: 1.0
imports:
  - interactive-grid._common.md
  - interactive-grid._columns._common.md
  - interactive-grid._saved-report._common.md
description: Standard editable interactive grid with toolbar, downloads, and a required baseline saved report.
---

# Purpose

Baseline interactive grid with an explicit source mode, editable rows, toolbar controls, shared columns, and a required baseline saved report.

---

# Generation Rules (MANDATORY)

1. Load `interactive-grid._common.md`, `interactive-grid._columns._common.md`, and `interactive-grid._saved-report._common.md` before use.
2. Validate SQL against the target schema or mark Validation Pending.
3. Ensure `keyColumn` maps to a column emitted in `{{columns}}` with `primaryKey: true`.

---

# Variable Contract

## Required Variables

- `regionStaticId`
- `name`
- `source.location`
- `keyColumn`
- `layout.sequence`
- `layout.slot`
- `columns` (from `interactive-grid._columns._common.md`)
- Plus one explicit source mode:
- Query-backed: `source.type`, `source.sqlQuery`
- Table-backed: `source.tableName`

## Optional Variables

- `appearance.template`
- `appearance.templateOptions`
- `edit.enabled`
- `edit.allowedOperations`
- `edit.allowedRowOperationsColumn`
- `source.orderByClause` (table-backed only)
- `toolbar.controls`
- `download.*`
- `performance.lazyLoading`
- `messages.whenNoDataFound`

---

## Output Template – Query-Backed

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
  pagination {
    type: {{pagination.type}}
    showTotalCount: {{pagination.showTotalCount}}
  }
  performance {
    lazyLoading: {{performance.lazyLoading}}
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

  {{columns}}
)
```

## Output Template – Table-Backed

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: interactiveGrid
  source {
    location: {{source.location}}
    tableName: {{source.tableName}}
    orderByClause: {{source.orderByClause}}
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
  pagination {
    type: {{pagination.type}}
    showTotalCount: {{pagination.showTotalCount}}
  }
  performance {
    lazyLoading: {{performance.lazyLoading}}
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

  {{columns}}
)
```

---

# Conditional Rendering Rules

- For query-backed grids, keep ordering inside `source.sqlQuery` unless the ordered value is also projected and declared as an Interactive Grid column.
- For table-backed grids, use `tableName` and an `orderByClause` composed only of declared Interactive Grid column names.
- `source.type: sqlQuery` is mandatory whenever `source.sqlQuery` is emitted.
- Do not emit `tableName` or `orderByClause` for query-backed grids.
- Omit optional blocks when corresponding variables are not provided.
- Omit `edit.allowedRowOperationsColumn` unless the request/spec explicitly identifies the row-operations control column from the region source.
- Render `{{columns}}` using `interactive-grid._columns._common.md`.
- Render the baseline `savedReport PRIMARY` plus any additional `{{savedReports}}` using `interactive-grid._saved-report._common.md`.
- If `source.orderByClause` is present, each referenced column must have a matching Interactive Grid `column` definition; hidden columns are allowed.
- Omit `pagination` when both `pagination.type` and `pagination.showTotalCount` are unnecessary.
- Always emit at least one `savedReport`, using `savedReport PRIMARY` as the default baseline.
- Declare `displayColumn` entries for every eligible Interactive Grid column; exclude `APEX$ROW_SELECTOR`, include `APEX$ROW_ACTION` when present.
- Omit `componentAdvanced` unless the grid needs JavaScript initialization that declarative settings cannot express.

# Order-By Examples

Valid example:

```apx
source {
  location: localDatabase
  tableName: ICMS_PAYMENTS
  orderByClause: CREATED_DATE desc, PAYMENT_ID desc
}

column PAYMENT_ID (
  type: hidden
  source {
    databaseColumn: PAYMENT_ID
    dataType: number
    primaryKey: true
  }
)

column CREATED_DATE (
  type: hidden
  source {
    databaseColumn: CREATED_DATE
    dataType: timestamp
  }
)
```

Invalid example:

```apx
source {
  location: localDatabase
  tableName: ICMS_PAYMENTS
  orderByClause: nvl(PAYMENT_DATE, SCHEDULED_DATE) desc
}
```

The invalid example uses a raw SQL expression instead of a declared Interactive Grid column. Move that ordering into `source.sqlQuery` or expose a projected column and define it in the grid first.
