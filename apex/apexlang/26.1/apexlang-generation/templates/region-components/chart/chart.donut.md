---
templateId: region.chart.donut
componentType: region
version: 1.0
imports:
  - chart._common.md
description: Donut-chart qualifier for chart regions.
---

# Purpose

Donut-chart variant of the native chart region.

# Generation Rules (MANDATORY)

1. Load `chart._common.md` first.
2. Set `chart.type` to `donut`.

# Variable Contract

## Required Variables

- `chart.type`
- `series.alias`

# Output Template – Full

```apexlang
chart {
  type: donut
}
```

# Conditional Rendering Rules

- Keep donut-center or legend treatment outside the shared shell unless the scenario requires it.
