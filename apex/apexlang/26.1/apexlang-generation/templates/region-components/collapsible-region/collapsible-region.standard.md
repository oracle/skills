---
templateId: region.collapsible.standard
componentType: region
version: 1.0
imports:
  - collapsible-region._common
description: Standard collapsible static-content region.
---

# Output Template

```
region {{regionStaticId}} (
  name: {{name}}
  type: staticContent
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: {{appearance.template}}
    templateOptions: [
      #DEFAULT#
      {{appearance.collapsedOption}}
      {{appearance.scrollOption}}
    ]
  }
)
```
