---
templateId: region.static-content.button.common
componentType: button
version: 1.0
description: Shared contract for buttons attached to static-content regions.
---

# Purpose

Provide a reusable button block for static-content scenarios that include toolbar or layout actions.

---

# Variable Contract

## Required Variables

- `button.staticId`
- `button.buttonName`
- `button.label`
- `button.layout.region`
- `button.layout.sequence`
- `button.layout.slot`

## Optional Variables

- `button.appearance.*`
- `button.behavior.*`
- `button.serverSideCondition.*`

## Appearance Defaults

- When `button.appearance.buttonTemplate` is `@/text-with-icon` and `button.appearance.icon` is present, `button.appearance.templateOptions` must include exactly one icon-position option.
- Default to `t-Button--iconLeft`; use `t-Button--iconRight` only when explicitly requested.
- When `button.appearance.buttonTemplate` is `@/icon`, do not add left/right icon-position options.

---

# Output Template – Button Block

```apexlang
button {{button.staticId}} (
  buttonName: {{button.buttonName}}
  label: {{button.label}}
  layout {
    sequence: {{button.layout.sequence}}
    region: @{{button.layout.region}}
    slot: {{button.layout.slot}}
  }
  appearance {
    buttonTemplate: {{button.appearance.buttonTemplate}}
    hot: {{button.appearance.hot}}
    templateOptions: {{button.appearance.templateOptions}}
    icon: {{button.appearance.icon}}
  }
  behavior {
    action: {{button.behavior.action}}
    warnOnUnsavedChanges: {{button.behavior.warnOnUnsavedChanges}}
  }
)
```

---

# Conditional Rendering Rules

- Omit optional appearance and behavior fields when not provided.
- Apply icon-placement defaults to the generated button block, not to the static-content or buttons-container region.
