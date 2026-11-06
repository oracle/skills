---
templateId: region.chart.gantt
componentType: region
version: 1.0
imports:
  - chart._common.md
  - chart._series._common.md
description: Gantt chart scenario with variable-driven task and timeline contracts.
---

# Purpose

Variable-driven gantt chart scenario with reusable series and scheduling placeholders.

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

  {{scenarioExtensions}}
)
```

---

# Conditional Rendering Rules

- Render `{{seriesBlocks}}` using `chart._series._common.md`.
- Omit axis blocks unless the chosen gantt configuration explicitly requires them.
