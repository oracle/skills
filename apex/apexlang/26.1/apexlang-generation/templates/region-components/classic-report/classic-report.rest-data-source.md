---
templateId: region.classic-report.classic-report-with-rest-data-source
componentType: region
version: 1.0
imports:
  - classic-report._common.md
  - classic-report._columns._common.md
description: Classic Report with REST Data Source region template.
---

# Purpose

Classic Report with REST Data Source

- Example REST Data source Classic Report
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
- `source.location` (use `restSource`)
- `source.restSource`
- `layout.sequence`
- `layout.slot`
- `appearance.template`
- `columns` (from `classic-report._columns._common.md`)

## Optional Variables

- `appearance.templateOptions`
- `messages.whenNoDataFound`
- `pagination.type`

---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: classicReport

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

  messages {
    whenNoDataFound: {{messages.whenNoDataFound}}
  }

  {{columns}}
)
```

---

# Conditional Rendering Rules

- Refer to `classic-report._common.md` for optional attributes and guardrails.
- When `appearance.templateOptions` contains more than one accepted value, emit bracketed multi-line array syntax with one accepted value per line; never use inline comma-separated arrays.
- Omit `pagination` when `pagination.type` is not provided.
- Omit `messages` when `messages.whenNoDataFound` is not provided.
- Render `{{columns}}` using `classic-report._columns._common.md`.
