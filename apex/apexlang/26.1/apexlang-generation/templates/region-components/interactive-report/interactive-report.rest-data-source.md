---
templateId: region.interactive-report.rest-data-source
componentType: region
version: 1.0
imports:
  - interactive-report._common.md
  - interactive-report._columns._common.md
description: Interactive report sourced from REST Data Source.
---

# Purpose

Interactive report sourced from REST Data Source (`restSource`).

---

# Generation Rules (MANDATORY)

1. Load `interactive-report._common.md`, `interactive-report._columns._common.md`, and `references/policies/memory-bank/30-pages/apex.interactive-report.md` before use.
2. Confirm REST Data Source aliases exist under `shared-components/rest-data-sources/`.
3. Remove optional blocks not required by the target implementation.

---

# Variable Contract

## Required Variables

- `regionStaticId`
- `name`
- `source.location` (use `restSource`)
- `source.restSource`
- `layout.sequence`
- `layout.slot`
- `appearance.template`
- `columns` (from `interactive-report._columns._common.md`)

## Optional Variables

- `appearance.templateOptions`
- `pagination.type`
- `performance.maxRowsToProcess`
- `messages.whenNoDataFound`
- `advanced.savedReportMappingIdentifier`
- `savedReport.*`

---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: interactiveReport

  source {
    location: {{source.location}}
    restSource: @{{source.restSource}}
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

  advanced {
    savedReportMappingIdentifier: {{advanced.savedReportMappingIdentifier}}
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

- Ensure `source.restSource` references an existing shared component alias.
- Render `{{columns}}` using `interactive-report._columns._common.md`.
- Omit optional blocks when their corresponding variables are not provided.
