---
templateId: region.faceted-search.standard
componentType: region
version: 1.0
imports:
  - faceted-search._common
description: Standard left-column faceted-search region paired with report results.
---

# Output Template

```
region {{searchRegionStaticId}} (
  name: {{name}}
  type: facetedSearch
  source {
    filteredRegion: @{{resultsRegionStaticId}}
  }
  layout {
    sequence: {{layout.sequence}}
    slot: leftColumn
  }
  appearance {
    template: {{appearance.template}}
    templateOptions: #DEFAULT#
  }
  settings {
    compactNosThreshold: 10000
    showCurrentFacets: true
    showTotalRowCount: true
  }
  {{facets}}
)
```

# Standard Notes

- Emit child facets as `facet (...)` blocks after the region shell.
- Default generated faceted-search regions use only the `settings` block values `compactNosThreshold: 10000`, `showCurrentFacets: true`, and `showTotalRowCount: true`.
- Emit `displayChartForTopNValues` only for explicit chart/top-N requests; use a positive integer such as `10`.
- Emit selector mode only for explicit external/current-facets selector requests. Pair `showCurrentFacets: selector` with a concrete `currentFacetsSelector` value.
- For the common “Product / Order Date / Order Status / Store” shape:
  - Product: `type: search` with `source.dbColumns`
  - Order Date: `type: range`
  - Order Status: `type: selectList`, `checkboxGroup`, or `radioGroup` with `lov { type: distinctValues }`
  - Store: `type: selectList`, `checkboxGroup`, or `radioGroup` with `lov { type: distinctValues }`
