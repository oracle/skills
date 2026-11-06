---
templateId: buttons.submit
componentType: button
version: 1.0
description: Submit page button variant, optionally with databaseAction for DML.
---

## Use When
- User requests save/create/update/delete submit behavior.

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
    action: submitPage
    databaseAction: {{behavior.databaseAction}}
    requiresConfirmation: {{behavior.requiresConfirmation}}
    warnOnUnsavedChanges: doNotCheck
  }
)
```

## Notes
- Include `databaseAction` only for DML intent.
- Add confirmation block only when required.
