---
templateId: region.classic-report.classic-report-with-rest-data-source-and-query-parameter
componentType: region
version: 1.0
imports:
  - classic-report._common.md
  - classic-report._columns._common.md
description: Classic Report with REST Data Source and query parameter region template.
---

# Purpose

Classic Report with REST Data Source and query parameter

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
- `source.pageItemsToSubmit`
- `layout.sequence`
- `layout.slot`
- `appearance.template`
- `columns` (from `classic-report._columns._common.md`)
- `parameter.name`
- `parameter.value.type`

## Optional Variables

- `appearance.templateOptions`
- `messages.whenNoDataFound`
- `pagination.type`
- `parameter.value.item`
- `parameter.value.staticValue`

---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: classicReport
  source {
    location: {{source.location}}
    restSource: @{{source.restSource}}
    pageItemsToSubmit: {{source.pageItemsToSubmit}}
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

  parameter (
    name: @{{parameter.name}}
    value {
      type: {{parameter.value.type}}
      item: {{parameter.value.item}}
      staticValue: {{parameter.value.staticValue}}
    }
  )
)
```

---

# Conditional Rendering Rules

- Refer to `classic-report._common.md` for optional attributes and guardrails.
- When `appearance.templateOptions` contains more than one accepted value, emit bracketed multi-line array syntax with one accepted value per line; never use inline comma-separated arrays.
- Omit `pagination` when `pagination.type` is not provided.
- Omit `messages` when `messages.whenNoDataFound` is not provided.
- Render `{{columns}}` using `classic-report._columns._common.md`.
- Omit `parameter.value.item` when `parameter.value.type` is not item-based.
- Omit `parameter.value.staticValue` when `parameter.value.type` is not static.
