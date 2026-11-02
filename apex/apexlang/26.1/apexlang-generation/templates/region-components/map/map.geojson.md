---
templateId: region.map.geojson
componentType: region
version: 1.0
imports:
  - map._common.md
description: GeoJSON qualifier for map regions.
---

# Purpose

Map-region variant for GeoJSON sources.

# Generation Rules (MANDATORY)

1. Load `map._common.md` first.
2. Use this variant when the source column carries GeoJSON payloads.

# Variable Contract

## Required Variables

- `qualifier`
- `layer.geojsonColumn`

# Output Template – Full

```apexlang
layer {
  geojsonColumn: {{layer.geojsonColumn}}
}
```

# Conditional Rendering Rules

- Keep the qualifier explicit as `geojson`.
