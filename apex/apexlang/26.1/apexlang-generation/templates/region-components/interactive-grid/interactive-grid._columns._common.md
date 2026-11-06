---
templateId: region.interactive-grid.columns.common
componentType: region
version: 1.0
description: Shared column contract for interactive grid regions.
---

# Purpose

Standardize `column` variable contracts, output shape, and guardrails for interactive-grid variants.

---

# Generation Rules (MANDATORY)

1. Load `interactive-grid._common.md` before using this columns contract.
2. Ensure one column maps to the region key column and can be marked as primary key in source metadata.
3. Omit optional nested blocks when their variables are not provided.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| column.name | yes | string | Column static identifier. |
| column.type | yes | enum | Grid item type (`textField`, `numberField`, `datePicker`, `textarea`, etc.). |
| column.heading | optional | string | Column heading text. |
| column.headingAlignment | optional | enum | `start`, `center`, `end`. |
| column.sequence | yes | number | Display sequence. |
| column.columnAlignment | optional | enum | `start`, `center`, `end`. |
| column.databaseColumn | optional | string | Backing DB column name. |
| column.dataType | optional | string | Source data type. |
| column.primaryKey | optional | boolean | Primary key indicator for the key column. |
| column.maxLength | optional | number | Validation max length. |
| column.sessionStateDataType | optional | string | Session state type for large text columns. `session`, `user`|
| column.columnFormatting.htmlExpression | optional | string | Column markup rendering expression. |
| column.columnFilter.lovType | optional | enum | Filter LOV behavior. |
| column.columnFilter.performanceImpactingOperators | optional | array | Performance-impacting operators list. |

---

# Output Template – Full

```apexlang
column {{column.name}} (
  type: {{column.type}}
  heading {
    heading: {{column.heading}}
    alignment: {{column.headingAlignment}}
  }
  layout {
    sequence: {{column.sequence}}
    columnAlignment: {{column.columnAlignment}}
  }
  source {
    databaseColumn: {{column.databaseColumn}}
    dataType: {{column.dataType}}
    primaryKey: {{column.primaryKey}}
  }
  validation {
    maxLength: {{column.maxLength}}
  }
  sessionState {
    dataType: {{column.sessionStateDataType}}
  }
  columnFormatting {
    htmlExpression: {{column.columnFormatting.htmlExpression}}
  }
  columnFilter {
    lovType: {{column.columnFilter.lovType}}
    performanceImpactingOperators: {{column.columnFilter.performanceImpactingOperators}}
  }
)
```

---

# Conditional Rendering Rules

- Omit `heading` when no heading values are provided.
- Omit `heading.alignment` and `layout.columnAlignment` when not provided.
- Omit `source` unless at least one source attribute is provided.
- Omit `validation` unless `column.maxLength` is provided.
- Omit `sessionState` unless `column.sessionStateDataType` is provided.
- Omit `columnFormatting` unless `column.columnFormatting.htmlExpression` is provided.
- Omit `columnFilter` unless one or more filter attributes are provided.
- Do not emit Classic Report-only `reportColumnQueryId`, `derivedColumn`, or `type: link` on Interactive Grid columns.
- Do not emit Interactive Report column-level `link {}` blocks on Interactive Grid columns unless compiler-backed metadata for the active build proves a supported grid column navigation shape.
- Do not emit column-level `appearance`, `comments`, or `security` blocks unless the active machine-readable schema explicitly allows them; surface guidance or authorization at page/region level when no column hook exists.

---

# Guardrails

- Keep column ordering deterministic and aligned with end-user workflows.
- Use `column.primaryKey: true` on the column that matches the grid key column.
- Keep performance-impacting operators minimal and intentional.
- When using `columnFormatting.htmlExpression`, do not emit `type: richText`; keep plain text implicit.
- Keep SQL data-only; emit report markup via `columnFormatting.htmlExpression` per `references/policies/memory-bank/30-pages/apex.report-column-rendering.md`.
- Keep saved-report `displayColumn` coverage separate from column definition shape; saved-report metadata does not imply column-level link/navigation support.
