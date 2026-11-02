---
templateId: buttons.trigger-action
componentType: button
version: 1.0
description: Button variant that triggers nested actions.
---

## Use When
- User requests triggerAction behavior (for example download or execute server-side code).

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
    action: triggerAction
    requiresConfirmation: {{behavior.requiresConfirmation}}
  }

  triggerAction {{triggerAction.staticId}} (
    action: {{triggerAction.action}}
  )
)
```
