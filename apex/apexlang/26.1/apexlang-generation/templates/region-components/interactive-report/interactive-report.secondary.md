---
templateId: region.interactive-report.secondary
componentType: region
version: 1.0
imports:
  - interactive-report._common.md
  - interactive-report._columns._common.md
description: Secondary interactive report configuration for demo or alternate defaults.
---

# Purpose

Secondary interactive report configuration for alternate defaults.

---

# Generation Rules (MANDATORY)

1. Load `interactive-report._common.md`, `interactive-report._columns._common.md`, and `references/policies/memory-bank/30-pages/apex.interactive-report.md` before use.
2. Validate SQL against the target schema or mark Validation Pending.
3. Remove optional blocks not required by the target implementation.

---

# Variable Contract

## Required Variables

- `regionStaticId`
- `name`
- `source.location`
- `source.type`
- `source.sqlQuery`
- `layout.sequence`
- `layout.slot`
- `columns` (from `interactive-report._columns._common.md`)

## Optional Variables

- `appearance.template`
- `appearance.templateOptions`
- `pagination.type`
- `performance.maxRowsToProcess`
- `messages.whenNoDataFound`
- `savedReport.*`

---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: interactiveReport

  source {
    location: {{source.location}}
    type: {{source.type}}
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

  pagination {
    type: {{pagination.type}}
  }

  performance {
    maxRowsToProcess: {{performance.maxRowsToProcess}}
  }

  messages {
    whenNoDataFound: {{messages.whenNoDataFound}}
  }

  {{columns}}

  savedReport {{savedReport.name}} (
    visibility: {{savedReport.visibility}}
    name: {{savedReport.displayName}}
    view {
      rowsPerPage: {{savedReport.rowsPerPage}}
    }
  )
)
```

---

# Conditional Rendering Rules

- Render `{{columns}}` using `interactive-report._columns._common.md`.
- Omit optional blocks when their corresponding variables are not provided.
