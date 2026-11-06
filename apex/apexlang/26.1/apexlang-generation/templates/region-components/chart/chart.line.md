---
templateId: region.chart.line
componentType: region
version: 1.0
imports:
  - chart._common.md
  - chart._series._common.md
  - chart._axis._common.md
description: Line chart scenario with variable-driven style and axis contracts.
---

# Purpose

Variable-driven line chart scenario for stepped/curved or other line configurations.

---

# Generation Rules (MANDATORY)

1. Load `chart._common.md` first.
2. Set `chart.type` to `line`.

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
  settings {
    zoomAndScroll: {{settings.zoomAndScroll}}
  }
  advanced {
    htmlDomId: {{advanced.htmlDomId}}
    regionDisplaySelector: {{advanced.regionDisplaySelector}}
  }
  chart {
    type: {{chart.type}}
    {{chart.options}}
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
- Keep line-chart trend and axis details in the series or axes groups when required.
- `settings.zoomAndScroll` is optional; use only when a chart needs Zoom and Scroll capabilities
  - Valid values for `settings.zoomAndScroll` are: `live` (default), `liveScrollOnly`, `delayed` and  `delayedScrollOnly`
