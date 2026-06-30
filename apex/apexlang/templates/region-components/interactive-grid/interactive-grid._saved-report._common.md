---
templateId: region.interactive-grid.saved-report.common
componentType: region
version: 1.0
description: Shared saved report contract for interactive grid regions.
---

# Purpose

Standardize saved report blocks for interactive-grid variants.

---

# Generation Rules (MANDATORY)

1. Load `interactive-grid._common.md` before using this contract.
2. Every Interactive Grid must include at least one saved report. Use `savedReport PRIMARY` as the default emitted baseline.
3. Display column references must point to defined grid columns.
4. Treat chart `Sort By = LABEL` as the implicit default behavior when packaged metadata marks it as the default; do not emit explicit `LABEL` unless the concrete DSL contract requires an explicit value.
5. Do not assume saved-report aggregate view/static-id metadata is hidden; keep metadata-backed aggregate identifiers visible when the accepted schema or template contract exposes them.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| savedReport.name | yes | string | Saved report static identifier. Use `PRIMARY` for the baseline emitted Interactive Grid saved report unless a different identifier is required. |
| savedReport.visibility | yes | enum | Saved report visibility. Valid values are `alternative`, `primary`, `private`, and `public`; emit `primary` by default. |
| savedReport.displayName | optional | string | User-facing name. |
| savedReport.viewDefault | optional | enum | Default view mode. |
| savedReport.singleRowDisplayedColumns | optional | boolean | Single-row displayed columns toggle. |
| displayColumn.column | yes | string | Column alias reference (without `@`). |
| displayColumn.sequence | yes | number | Display order in saved report. |

---

# Output Template – Full

```apexlang
savedReport {{savedReport.name}} (
  visibility: {{savedReport.visibility}}
  name: {{savedReport.displayName}}
  view {
    default: {{savedReport.viewDefault}}
  }
  singleRowView {
    displayedColumns: {{savedReport.singleRowDisplayedColumns}}
  }

  displayColumn (
    column: @{{displayColumn.column}}
    layout {
      sequence: {{displayColumn.sequence}}
    }
  )
)
```

---

# Conditional Rendering Rules

- Omit `name` when `savedReport.displayName` is not provided.
- Omit `view` when `savedReport.viewDefault` is not provided.
- Omit `singleRowView` when `savedReport.singleRowDisplayedColumns` is not provided.
- For chart saved-report sort behavior, treat explicit values as non-default overrides only. The metadata-backed explicit set for the current packaged baseline is `VALUE`, `HIGH`, `LOW`, `TARGET`, `X`, `Y`, and `Z`.
- For Interactive Grid output, keep one baseline `savedReport PRIMARY` with explicit `displayColumn` coverage even when no additional named saved reports are requested.
