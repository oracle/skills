---
templateId: region.dynamic-content.standard
componentType: region
version: 1.0
imports:
  - dynamic-content._common
description: Standard dynamic-content region with PL/SQL function body.
---

# Output Template

```
region {{regionStaticId}} (
  name: {{name}}
  type: dynamicContent
  source {
    plsqlFunctionBody:
      ```plsql
      {{source.plsqlFunctionBody}}
      ```
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: {{appearance.template}}
    templateOptions: #DEFAULT#
  }
)
```
