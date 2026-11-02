---
templateId: region.interactive-report.nl2ir
componentType: region
version: 1.0
imports:
  - interactive-report._common.md
  - interactive-report._columns._common.md
description: Interactive report with Natural Language (NL2IR) settings.
---

# Purpose

Interactive report configured for Natural Language to Interactive Report (NL2IR).

---

# Generation Rules (MANDATORY)

1. Load `interactive-report._common.md`, `interactive-report._columns._common.md`, `references/policies/memory-bank/30-pages/apex.interactive-report.md`, and `references/policies/memory-bank/00-guard/ai.guard.md` before use.
2. NL2IR report and column context must scan annotations first, use descriptive annotations before comments, and never infer missing context.
3. If no DB connection is available, request `db_connection_name` and stop.

---

# Variable Contract

## Required Variables

- `regionStaticId`
- `name`
- `source.location`
- `source.tableName`
- `layout.sequence`
- `layout.slot`
- `appearance.template`
- `genAI.naturalLanguageSupport`
- `genAI.reportContext` (from table/view annotation `report_context`, else `description`, else table/view comment)
- `columns` (from `interactive-report._columns._common.md`)

## Optional Variables

- `appearance.templateOptions`
- `pagination.type`
- `messages.whenNoDataFound`
- `messages.whenMoreDataFound`
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
    tableName: {{source.tableName}}
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

  messages {
    whenNoDataFound: {{messages.whenNoDataFound}}
    whenMoreDataFound: {{messages.whenMoreDataFound}}
  }

  genAI {
    naturalLanguageSupport: {{genAI.naturalLanguageSupport}}
    reportContext: {{genAI.reportContext}}
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

- NL2IR context must be derived from annotations first, using descriptive annotations before comments as fallback.
- Render `{{columns}}` using `interactive-report._columns._common.md`.
- Omit optional blocks when their corresponding variables are not provided.
