---
templateId: region.chart.status-meter-gauge
componentType: region
version: 1.0
imports:
  - chart._common.md
  - chart._series._common.md
description: Status meter gauge scenario with variable-driven thresholds and source contracts.
---

# Purpose

Variable-driven status meter gauge scenario for circular or horizontal gauge variants.

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
  gauge {
    orientation: {{chart.orientation}}
    {{gauge}}
  }

  {{seriesBlocks}}

  {{scenarioExtensions}}
)
```

---

# Conditional Rendering Rules

- Render `{{seriesBlocks}}` using `chart._series._common.md`.
- Omit `gauge` options when defaults are sufficient.
