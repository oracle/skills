---
templateId: buttons.menu
componentType: button
version: 1.0
description: Menu button variant with nested menu entries.
---

## Use When
- User asks for a menu button with child entries.

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
    action: menu
  }

  menu {{menuEntry.staticId}} (
    label: {{menuEntry.label}}
    layout {
      sequence: {{menuEntry.sequence}}
    }
    behavior {
      type: {{menuEntry.type}}
      target: {{menuEntry.target}}
    }
  )
)
```
