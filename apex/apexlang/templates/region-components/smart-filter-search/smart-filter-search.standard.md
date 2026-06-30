---
templateId: region.smart-filters.standard
componentType: region
version: 1.0
imports:
  - smart-filter-search._common
description: Standard smart filters region for search/filter experiences.
---

# Output Template

```
region {{smartFiltersRegionStaticId}} (
  name: {{name}}
  type: smartFilters
  source {
    filteredRegion: @{{source.filteredRegion}}
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: {{appearance.template}}
    templateOptions: #DEFAULT#
  }
  {{filters}}
)
```
