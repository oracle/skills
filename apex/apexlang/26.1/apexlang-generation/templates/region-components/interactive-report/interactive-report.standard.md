---
templateId: region.interactive-report.standard
componentType: region
version: 1.0
imports:
  - interactive-report._common.md
  - interactive-report._columns._common.md
description: Standard interactive report sourced from SQL with links, saved report, and detail view.
---

# Purpose

Standard interactive report with SQL source, link settings, and saved report defaults.

---

# Generation Rules (MANDATORY)

1. Load `interactive-report._common.md`, `interactive-report._columns._common.md`, and `references/policies/memory-bank/30-pages/apex.interactive-report.md` before use.
2. Validate SQL against the target schema or mark Validation Pending.
3. Remove optional blocks that are not required by the page design.
4. For Interactive Report search or filter binds in `source.sqlQuery`, use case-insensitive `LOWER()` normalization on both sides of `=` / `!=` / `LIKE`.

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
- `columns` (from `interactive-report._columns._common.md`)

## Optional Variables

- `appearance.templateOptions`
- `advanced.htmlDomId`
- `link.*`
- `componentAppearance.showNullValuesAs`
- `pagination.type`
- `performance.maxRowsToProcess`
- `messages.whenNoDataFound`
- `messages.whenMoreDataFound`
- `actionsMenu.savePublicReport`
- `download.formats`
- `detailView.show`
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

  advanced {
    htmlDomId: {{advanced.htmlDomId}}
  }

  link {
    linkColumn: {{link.linkColumn}}
    target: {{link.target}}
    linkIcon: {{link.linkIcon}}
    linkAttributes: {{link.linkAttributes}}
  }

  componentAppearance {
    showNullValuesAs: {{componentAppearance.showNullValuesAs}}
  }

  pagination {
    type: {{pagination.type}}
  }

  performance {
    maxRowsToProcess: {{performance.maxRowsToProcess}}
  }

  messages {
    whenNoDataFound: {{messages.whenNoDataFound}}
    whenMoreDataFound: {{messages.whenMoreDataFound}}
  }

  actionsMenu {
    savePublicReport: {{actionsMenu.savePublicReport}}
  }

  download {
    formats: {{download.formats}}
  }

  detailView {
    show: {{detailView.show}}
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
