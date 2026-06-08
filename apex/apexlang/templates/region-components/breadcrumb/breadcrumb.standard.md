---
templateId: region.breadcrumb.standard
componentType: region
version: 1.0
imports:
  - breadcrumb._common
description: Standard standalone breadcrumb region.
---

# Output Template

```
region {{regionStaticId}} (
  name: {{page.title}}
  type: breadcrumb
  source {
    breadcrumb: @{{source.breadcrumb}}
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: {{appearance.template}}
    templateOptions: #DEFAULT#
    parentEntry: @{{parent.name}}
  }
  componentAppearance {
    breadcrumbTemplate: @{{componentAppearance.breadcrumbTemplate}}
    templateOptions: #DEFAULT#
  }
)
```
