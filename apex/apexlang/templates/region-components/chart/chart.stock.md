---
templateId: region.chart.stock
componentType: region
version: 1.0
imports:
  - chart._common.md
  - chart._series._common.md
  - chart._axis._common.md
description: Stock chart scenario with variable-driven OHLC series and axis contracts.
---

# Purpose

Variable-driven stock chart scenario with configurable overview and zoom behavior.

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
  }
  settings {
    initialZooming: {{chart.initialZooming}}
    {{chart.options}}
  }
  legend {
    {{legend}}
  }

  {{seriesBlocks}}

  {{axisBlocks}}
)
```

---

# Conditional Rendering Rules

- Render `{{seriesBlocks}}` using `chart._series._common.md`.
- Render `{{axisBlocks}}` using `chart._axis._common.md`.
