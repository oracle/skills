---
templateId: region.chart.series.common
componentType: region
version: 1.0
imports:
  - chart._common.md
description: Shared contract for chart series blocks.
---

# Purpose

Standardize reusable series contracts across all chart scenarios.

---

# Variable Contract

## Required Variables

- `seriesBlocks`

## Series Fields

- `series.staticId`
- `series.name`
- `series.source.type`
- `series.columnMapping`

## Optional Series Fields

- `series.execution.*`
- `series.source.sqlQuery`
- `series.source.restSource`
- `series.source.pageItemsToSubmit`
- `series.appearance.*`
- `series.label.*`
- `series.marker.*`
- `series.line.*`
- `series.advanced.*`

---

# Output Template – Series Block

```apexlang
series {{series.staticId}} (
  name: {{series.name}}
  execution {
    sequence: {{series.execution.sequence}}
  }
  source {
    type: {{series.source.type}}
    restSource: @{{series.source.restSource}}
    pageItemsToSubmit: {{series.source.pageItemsToSubmit}}
    sqlQuery:
      ```sql
      {{series.source.sqlQuery}}
      ```
  }
  columnMapping {
    {{series.columnMapping}}
  }
  appearance {
    {{series.appearance}}
  }
  line {
    {{series.line}}
  }
  marker {
    {{series.marker}}
  }
  label {
    {{series.label}}
  }
  advanced {
    {{series.advanced}}
  }
)
```

---

# Conditional Rendering Rules

- Render only attributes needed by the target chart type.
- Keep alias mappings deterministic and schema-valid.
- SQL output aliases referenced by `columnMapping` must match the returned query metadata exactly, including case.
- For generated SQL-backed charts, prefer uppercase aliases in both the SQL and `columnMapping` (for example `LABEL`, `VALUE`, `STORE_LABEL`, `TOTAL_VALUE`) to avoid runtime column-resolution mismatches.
- Use `columnMapping.customTooltip`, `columnMapping.legendTooltip`, or `columnMapping.labelTooltip` for tooltip columns; do not emit a `series.tooltip` group.
