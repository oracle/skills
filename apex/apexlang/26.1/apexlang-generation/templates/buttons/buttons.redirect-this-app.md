---
templateId: buttons.redirect-this-app
componentType: button
version: 1.0
description: Redirect button variant to navigate within the current application.
---

## Use When
- User requests navigation to another page in the same app.

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
    templateOptions: {{appearance.templateOptions}}
    icon: {{appearance.icon}}
  }
  behavior {
    action: redirectThisApp
    target: {
        page: {{behavior.target.page}}
        items: {
            {{behavior.target.items}}
        }
        clearCache: {{behavior.target.clearCache}}
        action: {{behavior.target.action}}
        request: {{behavior.target.request}}
    }
    requiresConfirmation: {{behavior.requiresConfirmation}}
    warnOnUnsavedChanges: {{behavior.warnOnUnsavedChanges}}
  }
)
```
