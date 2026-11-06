---
templateId: region.interactive-report.rest-data-source-parameter
componentType: region
version: 1.0
imports:
  - interactive-report._common.md
  - interactive-report._columns._common.md
description: Interactive report using REST Data Source with page item parameters.
---

# Purpose

Interactive report backed by REST Data Source with page item parameter and refresh action.

---

# Generation Rules (MANDATORY)

1. Load `interactive-report._common.md`, `interactive-report._columns._common.md`, and `references/policies/memory-bank/30-pages/apex.interactive-report.md` before use.
2. Confirm REST Data Source aliases exist under `shared-components/rest-data-sources/`.
3. Ensure page items listed in `source.pageItemsToSubmit` exist on the page.

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
- `columns` (from `interactive-report._columns._common.md`)
- `parameter.name`
- `parameter.value.type`
- `pageItem.name`
- `dynamicAction.name`

## Optional Variables

- `appearance.templateOptions`
- `pagination.type`
- `messages.whenNoDataFound`
- `messages.whenMoreDataFound`
- `advanced.savedReportMappingIdentifier`
- `parameter.value.item`
- `parameter.value.staticValue`
- `pageItem.*`
- `dynamicAction.*`

---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: interactiveReport

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
    templateOptions: {{appearance.templateOptions}}
  }

  pagination {
    type: {{pagination.type}}
  }

  messages {
    whenNoDataFound: {{messages.whenNoDataFound}}
    whenMoreDataFound: {{messages.whenMoreDataFound}}
  }

  advanced {
    savedReportMappingIdentifier: {{advanced.savedReportMappingIdentifier}}
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

pageItem {{pageItem.name}} (
  type: {{pageItem.type}}
  label {
    label: {{pageItem.label}}
    alignment: {{pageItem.labelAlignment}}
  }
  layout {
    sequence: {{pageItem.sequence}}
    slot: {{pageItem.slot}}
    alignment: {{pageItem.alignment}}
  }
  appearance {
    template: {{pageItem.template}}
    templateOptions: {{pageItem.templateOptions}}
    width: {{pageItem.width}}
  }
)

dynamicAction {{dynamicAction.name}} (
  name: {{dynamicAction.displayName}}
  execution {
    sequence: {{dynamicAction.sequence}}
  }
  when {
    selectionType: {{dynamicAction.when.selectionType}}
    items: {{dynamicAction.when.items}}
  }

  action {{dynamicAction.action.name}} (
    action: refresh
    affectedElements {
      selectionType: region
      region: @{{regionStaticId}}
    }
    execution {
      sequence: {{dynamicAction.action.sequence}}
      event: @{{dynamicAction.name}}
      fireOnInit: {{dynamicAction.action.fireOnInit}}
    }
  )
)
```

---

# Conditional Rendering Rules

- Render `{{columns}}` using `interactive-report._columns._common.md`.
- Omit `parameter.value.item` when value type is not `item`.
- Omit `parameter.value.staticValue` when value type is not `static`.
- Omit optional page item and dynamic action attributes when not provided.
