---
templateId: region.map.longitude-latitude
componentType: region
version: 1.0
imports:
  - map._common.md
description: Longitude/latitude qualifier for map regions.
---

# Purpose

Map-region variant for separate longitude and latitude columns.

# Generation Rules (MANDATORY)

1. Load `map._common.md` first.
2. Use this variant when the source exposes separate coordinate columns.

# Variable Contract

## Required Variables

- `qualifier`
- `layer.longitudeColumn`
- `layer.latitudeColumn`

# Output Template – Full

```apexlang
layer {
  longitudeColumn: {{layer.longitudeColumn}}
  latitudeColumn: {{layer.latitudeColumn}}
}
```

# Conditional Rendering Rules

- Keep the qualifier explicit as `longitudeLatitude`.
