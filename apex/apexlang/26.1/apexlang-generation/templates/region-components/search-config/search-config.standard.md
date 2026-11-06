---
templateId: region.search-config.standard
componentType: region
version: 1.0
imports:
  - search-config._common
description: Standard search region wired to page item and shared searchConfig.
---

# Output Template

```
region {{searchRegionStaticId}} (
  name: {{name}}
  type: search
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  settings {
    searchPageItem: {{settings.searchPageItem}}
  }
  searchSource {{searchSource.staticId}} (
    name: {{searchSource.name}}
    searchConfig: @{{searchSource.searchConfig}}
  )
)
```
