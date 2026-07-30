---
templateId: region.chart.pie
componentType: region
version: 1.0
imports:
  - chart._common.md
  - chart._series._common.md
description: Pie or donut chart scenario with variable-driven series contracts.
---

# Purpose

Variable-driven pie/donut chart scenario with optional threshold and selection options.

---

# Generation Rules (MANDATORY)

1. Load `chart._common.md` first.
2. Set `chart.type` to `pie`.

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
  chart {
    type: {{chart.type}}
  }
  settings {
    pieSelectionEffect: {{chart.pieSelectionEffect}}
  }
  value {
    pieChartOtherThreshold: {{chart.otherThreshold}}
  }
  chartLayout {
    {{chartLayout}}
  }
  legend {
    {{legend}}
  }

  {{seriesBlocks}}

  {{scenarioExtensions}}
)
```

---

# Conditional Rendering Rules

- Render `{{seriesBlocks}}` using `chart._series._common.md`.
- Omit pie-only options when using non-pie chart types.
- Suppress axis guidance for pie charts.
- Do not emit `chart.style`; the current grammar has no pie chart style property.
