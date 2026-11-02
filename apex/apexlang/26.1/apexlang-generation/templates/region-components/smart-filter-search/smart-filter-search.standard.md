---
templateId: region.smart-filters.standard
componentType: region
version: 1.1
imports:
  - smart-filter-search._common
description: Standard Smart Filters region with one search child bound to a secured base results region.
---

# Usage

Use only after the common contract has resolved `baseRegionStaticId`, the searchable allowlist, search behavior, security parity, performance evidence, and compiler-gated settings. Pair this component with the exact selected template for the base results region; this scenario does not invent a generic base-region shell.

# Output Template

```apexlang
region {{smartFiltersRegionStaticId}} (
    name: {{name}}
    type: smartFilters
    source {
        filteredRegion: @{{baseRegionStaticId}}
    }
    layout {
        sequence: {{layout.sequence}}
        slot: {{layout.slot}}
    }
    appearance {
        template: {{appearance.template}}
        templateOptions: #DEFAULT#
    }
    filter {{searchFilterItemName}} (
        type: search
        label {
            label: {{searchFilterLabel}}
        }
        layout {
            sequence: {{searchFilterSequence}}
        }
        source {
            dbColumns: {{searchableAttributes}}
        }
    )
    {{additionalFilters}}
)
```
