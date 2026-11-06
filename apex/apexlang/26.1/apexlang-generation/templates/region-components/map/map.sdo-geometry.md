---
templateId: region.map.sdo-geometry
componentType: region
version: 1.0
imports:
  - map._common.md
description: SDO geometry qualifier for map regions.
---

# Purpose

Map-region variant for SDO geometry sources.

# Generation Rules (MANDATORY)

1. Load `map._common.md` first.
2. Use this variant when the source column is an SDO geometry column.

# Variable Contract

## Required Variables

- `qualifier`
- `layer.geometryColumn`

# Output Template – Full

```apexlang
layer {
  geometryColumn: {{layer.geometryColumn}}
}
```

# Conditional Rendering Rules

- Keep the qualifier explicit as `sdoGeometry`.
