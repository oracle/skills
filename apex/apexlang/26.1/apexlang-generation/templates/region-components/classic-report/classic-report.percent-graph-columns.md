---
templateId: region.classic-report.percent-graph-example
componentType: region
version: 1.0
imports:
  - classic-report._common.md
  - classic-report._columns._common.md
description: Percent Graph Example region template.
---

# Purpose

Percent Graph Example

- =========================

---

# Generation Rules (MANDATORY)

1. Load `classic-report._common.md`, `classic-report._columns._common.md`, and `references/policies/memory-bank/30-pages/apex.classic-report.md` before use.
2. Validate SQL against the target schema or mark Validation Pending.
3. Remove optional blocks not required for the target implementation.

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
- `appearance.template`
- `pagination.type`
- `columns` (from `classic-report._columns._common.md`)

## Optional Variables

- `appearance.templateOptions`

---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: classicReport

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
    templateOptions: [
      {{appearance.templateOptions}}
    ]
  }

  componentAppearance {
    template: {{componentAppearance.template}}
    templateOptions: {{componentAppearance.templateOptions}}
  }

  pagination {
    type: {{pagination.type}}
  }

  {{columns}}
)
```

---

# Conditional Rendering Rules

- Refer to `classic-report._common.md` for optional attributes and guardrails.
- When `appearance.templateOptions` contains more than one accepted value, emit bracketed multi-line array syntax with one accepted value per line; never use inline comma-separated arrays.
- Render `{{columns}}` using `classic-report._columns._common.md`.
