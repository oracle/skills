---
templateId: region.chart.axis.common
componentType: region
version: 1.0
imports:
  - chart._common.md
description: Shared contract for chart axis blocks.
---

# Purpose

Standardize reusable axis contracts across cartesian and dual-axis chart scenarios.

---

# Variable Contract

## Required Variables

- `axisBlocks`

## Axis Fields

- `axis.staticId`
- `axis.name`

## Optional Axis Fields

- `axis.title`
- `axis.value.min`
- `axis.value.max`
- `axis.value.*`
- `axis.majorTicks.*`
- `axis.minorTicks.*`

---

# Output Template – Axis Block

```apexlang
axis {{axis.staticId}} (
  name: {{axis.name}}
  title: {{axis.title}}
  value {
    min: {{axis.value.min}}
    max: {{axis.value.max}}
    format: {{axis.value.format}}
    decimalPlaces: {{axis.value.decimalPlaces}}
    formatScaling: {{axis.value.formatScaling}}
  }
  majorTicks {
    show: {{axis.majorTicks.show}}
  }
  minorTicks {
    show: {{axis.minorTicks.show}}
  }
)
```

---

# Conditional Rendering Rules

- Cartesian charts must render x and y axis blocks.
- Render y2 axis only when one or more series are assigned to the secondary axis.
- Use plural tick block names: `majorTicks` and `minorTicks`.
- Axis value formatting must use supported APEX enums; omit `value.format` for textual axes.
