---
templateId: region.interactive-report.page-header-actions
componentType: region
version: 1.0
imports:
  - interactive-report._common.md
description: Optional page header, breadcrumb, and IR action button patterns.
---

# Purpose

Optional page header, breadcrumb, and IR action button patterns used with interactive reports.

---

# Generation Rules (MANDATORY)

1. Load `interactive-report._common.md` and `references/policies/memory-bank/30-pages/apex.page.md` before use.
2. Use only existing theme templates and breadcrumb aliases.
3. Use action buttons with `slot: RIGHT_OF_IR_SEARCH_BAR` only when bound to a specific IR region.

---

# Variable Contract

## Required Variables

- `headerRegion.staticId`
- `headerRegion.name`
- `headerRegion.type`
- `headerRegion.sequence`
- `headerRegion.slot`
- `breadcrumbRegion.staticId`
- `breadcrumbRegion.name`
- `breadcrumbRegion.breadcrumb`
- `button.staticId`
- `button.buttonName`
- `button.label`
- `button.region`
- `dynamicAction.staticId`

## Optional Variables

- `headerRegion.title`
- `headerRegion.display`
- `breadcrumbRegion.sequence`
- `breadcrumbRegion.parentRegion`
- `breadcrumbRegion.slot`
- `breadcrumbRegion.template`
- `breadcrumbRegion.templateOptions`
- `breadcrumbRegion.breadcrumbTemplate`
- `button.sequence`
- `button.slot`
- `button.template`
- `button.templateOptions`
- `button.icon`
- `button.action`
- `dynamicAction.name`
- `dynamicAction.sequence`
- `dynamicAction.event`
- `dynamicAction.action.*`

---

# Output Template – Full

```apexlang
region {{headerRegion.staticId}} (
  name: {{headerRegion.name}}
  title: {{headerRegion.title}}
  type: {{headerRegion.type}}
  layout {
    sequence: {{headerRegion.sequence}}
    slot: {{headerRegion.slot}}
  }
  componentAppearance {
    display: {{headerRegion.display}}
  }
)

region {{breadcrumbRegion.staticId}} (
  name: {{breadcrumbRegion.name}}
  type: breadcrumb
  source {
    breadcrumb: @{{breadcrumbRegion.breadcrumb}}
  }
  layout {
    sequence: {{breadcrumbRegion.sequence}}
    parentRegion: @{{breadcrumbRegion.parentRegion}}
    slot: {{breadcrumbRegion.slot}}
  }
  appearance {
    template: {{breadcrumbRegion.template}}
    templateOptions: {{breadcrumbRegion.templateOptions}}
  }
  componentAppearance {
    breadcrumbTemplate: @{{breadcrumbRegion.breadcrumbTemplate}}
    templateOptions: {{breadcrumbRegion.templateOptions}}
  }
)

button {{button.staticId}} (
  buttonName: {{button.buttonName}}
  label: {{button.label}}
  layout {
    sequence: {{button.sequence}}
    region: @{{button.region}}
    slot: {{button.slot}}
  }
  appearance {
    buttonTemplate: {{button.template}}
    templateOptions: {{button.templateOptions}}
    icon: {{button.icon}}
  }
  behavior {
    action: {{button.action}}
  }
)

dynamicAction {{dynamicAction.staticId}} (
  name: {{dynamicAction.name}}
  execution {
    sequence: {{dynamicAction.sequence}}
  }
  when {
    event: {{dynamicAction.event}}
    selectionType: button
    button: @{{button.staticId}}
  }

  action {{dynamicAction.action.staticId}} (
    action: {{dynamicAction.action.type}}
    execution {
      sequence: {{dynamicAction.action.sequence}}
      event: @{{dynamicAction.staticId}}
      fireOnInit: {{dynamicAction.action.fireOnInit}}
    }
  )
)
```

---

# Conditional Rendering Rules

- Replace theme template references with valid aliases.
- Remove button and dynamic action blocks when no custom action is required.
- Do not emit a dynamic-action `action.settings` block; action-specific dialog text must wait for a grammar-backed property path.
