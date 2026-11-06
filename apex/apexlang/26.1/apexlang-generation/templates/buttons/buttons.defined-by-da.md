---
templateId: buttons.defined-by-da
componentType: button
version: 1.0
description: Button variant whose behavior is defined by dynamic actions.
---

## Use When
- User asks for a button handled by dynamic action logic.

## Template
```apexlang
button {{buttonStaticId}} (
  buttonName: {{buttonName}}
  label: {{label}}
  layout {
    sequence: {{layout.sequence}}
    region: {{layout.region}}
    slot: {{layout.slot}}
  }
  appearance {
    buttonTemplate: {{appearance.buttonTemplate}}
    templateOptions: [
      {{appearance.templateOptions}}
    ]
    icon: {{appearance.icon}}
  }
  behavior {
    action: definedByDynamicAction
    requiresConfirmation: {{behavior.requiresConfirmation}}
  }
)
```

## Notes
- Do not include `warnOnUnsavedChanges` for this action type.
