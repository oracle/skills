---
templateId: region.chart.line-with-area
componentType: region
version: 1.0
imports:
  - chart._common.md
  - chart._series._common.md
  - chart._axis._common.md
description: Line-with-area chart scenario with variable-driven axis and series contracts.
---

# Purpose

Variable-driven mixed line/area chart scenario.

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
)
```

---

# Conditional Rendering Rules

- Render `{{seriesBlocks}}` using `chart._series._common.md`.
- Render `{{axisBlocks}}` using `chart._axis._common.md`.
