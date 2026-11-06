---
templateId: region.classic-report.standard-classic-report
componentType: region
version: 1.0
imports:
  - classic-report._common.md
  - classic-report._columns._common.md
description: Standard Classic Report region template.
---

# Purpose

Standard Classic Report

- =========================

---

# Generation Rules (MANDATORY)

1. Load `classic-report._common.md`, `classic-report._columns._common.md`, and `references/policies/memory-bank/30-pages/apex.classic-report.md` before use.
2. Validate SQL against the target schema or mark Validation Pending.
3. Remove optional blocks not required for the target implementation.
4. When `pagination.type` is emitted, use only the classic-report pagination catalog from `classic-report._common.md`; do not emit interactive-report values such as `rowRangesXToY` or `rowRangesXToYOfZ`.

---

# Variable Contract

## Required Variables

- `regionStaticId`
- `name`
- `source.location` (typically `localDatabase`)
- `source.type` (typically `sqlQuery`)
- `source.sqlQuery`
- `layout.sequence`
- `layout.slot`
- `appearance.template`
- `columns` (from `classic-report._columns._common.md`)

## Optional Variables

- `appearance.templateOptions`
- `headerAndFooter.headerText`
- `headerAndFooter.footerText`
- `pagination.type`
- `messages.whenNoDataFound`
- `serverSideCondition.*`

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

  headerAndFooter {
    headerText: {{headerAndFooter.headerText}}
    footerText: {{headerAndFooter.footerText}}
  }

  pagination {
    type: {{pagination.type}}
  }

  messages {
    whenNoDataFound: {{messages.whenNoDataFound}}
  }

  serverSideCondition {
    type: {{serverSideCondition.type}}
    item: {{serverSideCondition.item}}
    {{serverSideCondition.comparisonAttribute}}: {{serverSideCondition.comparisonValue}}
  }

  {{columns}}
)
```

---

# Conditional Rendering Rules

- Refer to `classic-report._common.md` for optional attributes and guardrails.
- When `appearance.templateOptions` contains more than one accepted value, emit bracketed multi-line array syntax with one accepted value per line; never use inline comma-separated arrays.
- Omit `headerAndFooter` when neither `headerAndFooter.headerText` nor `headerAndFooter.footerText` is provided.
- Omit `pagination` when `pagination.type` is not provided.
- Omit `messages` when `messages.whenNoDataFound` is not provided.
- Omit `serverSideCondition` when condition inputs are not provided.
- Render `{{columns}}` using `classic-report._columns._common.md`.
