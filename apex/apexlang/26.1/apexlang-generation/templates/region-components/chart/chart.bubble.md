---
templateId: region.chart.bubble
componentType: region
version: 1.0
imports:
  - chart._common.md
  - chart._series._common.md
  - chart._axis._common.md
description: Bubble chart scenario with variable-driven source and axis contracts.
---

# Purpose

Variable-driven bubble chart scenario for multi-metric comparisons.

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
  chart {
    type: {{chart.type}}
    {{chart.options}}
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
