---
templateId: region.chart.area
componentType: region
version: 1.0
imports:
  - chart._common.md
  - chart._series._common.md
  - chart._axis._common.md
description: Area chart scenario with variable-driven legend and series contracts.
---

# Purpose

Variable-driven area chart scenario with shared series and axis contracts.

---

# Generation Rules (MANDATORY)

1. Load `chart._common.md` first.
2. Set `chart.type` to `area`.

---

# Variable Contract

## Required Variables

- `chart.type`
- `series.alias`

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
  chartLayout {
    {{chartLayout}}
  }
  dataCursor {
    {{dataCursor}}
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
- Keep area fill behavior in the series or chart attributes only when the design requires it.
