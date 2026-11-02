---
templateId: buttons.redirect-other-app
componentType: button
version: 1.0
description: Redirect button variant to navigate to another application.
---

## Use When
- User requests cross-application navigation.

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
    action: redirectOtherApp
    target: {{behavior.target}}
    requiresConfirmation: {{behavior.requiresConfirmation}}
    warnOnUnsavedChanges: {{behavior.warnOnUnsavedChanges}}
  }
)
```
