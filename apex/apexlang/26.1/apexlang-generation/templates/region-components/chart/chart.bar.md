---
templateId: region.chart.bar
componentType: region
version: 1.0
imports:
  - chart._common.md
  - chart._series._common.md
  - chart._axis._common.md
description: Bar chart scenario with optional dual-axis configuration.
---

# Purpose

Variable-driven bar chart scenario with optional secondary axis and series formatting.

---

# Generation Rules (MANDATORY)

1. Load `chart._common.md` first.
2. Set `chart.type` to `bar`.

---

# Variable Contract

## Required Variables

- `chart.type`
- `series.alias`
- `columnMapping.label`
- `columnMapping.value`

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
    htmlDomId: {{advanced.htmlDomId}}
    regionDisplaySelector: {{advanced.regionDisplaySelector}}
  }
  chart {
    type: {{chart.type}}
    {{chart.options}}
  }
  chartAppearance {
    {{chartAppearance}}
  }
  chartLayout {
    {{chartLayout}}
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
- Include y2 axis only when a series is assigned to the secondary axis.
- Keep bar-chart-specific axis tuning outside the shared shell unless required.
