---
templateId: region.chart.dashboard-combination
componentType: region
version: 1.0
imports:
  - chart._common.md
  - chart._series._common.md
  - chart._axis._common.md
description: Dashboard combination chart scenario with variable-driven region contracts.
---

# Purpose

Variable-driven dashboard chart scenario that composes multiple series behaviors in one region.

---

# Output Template – Full

```apexlang
region {{chartRegion.staticId}} (
  name: {{chartRegion.name}}
  type: chart
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: {{appearance.template}}
    templateOptions: {{appearance.templateOptions}}
  }
  advanced {
    regionDisplaySelector: {{advanced.regionDisplaySelector}}
  }
  chart {
    type: {{chart.type}}
    {{chart.options}}
  }
  chartAppearance {
    {{chartAppearance}}
  }
  legend {
    {{legend}}
  }

  {{seriesBlocks}}

  {{axisBlocks}}

  {{scenarioExtensions}}
)
```

---

# Conditional Rendering Rules

- Render `{{seriesBlocks}}` using `chart._series._common.md`.
- Render `{{axisBlocks}}` using `chart._axis._common.md`.
