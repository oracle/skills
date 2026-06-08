---
templateId: region.classic-report.contextual-info-column-based
componentType: region
version: 1.0
imports:
  - classic-report._common.md
  - classic-report._columns._common.md
description: Contextual Info (Column-based) region template.
---

# Purpose

Contextual Info (Column-based)

- Example of contextual metrics in columns (horizontal).
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
- `columns` (from `classic-report._columns._common.md`)

## Optional Variables

- `appearance.templateOptions`
- `headerAndFooter.headerText`
- `headerAndFooter.footerText`
- `messages.whenNoDataFound`

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

  messages {
    whenNoDataFound: {{messages.whenNoDataFound}}
  }

  {{columns}}
)
```

---

# Conditional Rendering Rules

- Refer to `classic-report._common.md` for optional attributes and guardrails.
- For contextual-info appearance, use `template: @/contextual-info` with `templateOptions` exactly `#DEFAULT#`, `t-Region--hideHeader js-addHiddenHeadingRoleDesc`, and `t-Region--noUI`.
- When `appearance.templateOptions` contains more than one accepted value, emit bracketed multi-line array syntax with one accepted value per line; never use inline comma-separated arrays.
- Omit `headerAndFooter` when no header/footer values are provided.
- Omit `messages` when `messages.whenNoDataFound` is not provided.
- Render `{{columns}}` using `classic-report._columns._common.md`.
