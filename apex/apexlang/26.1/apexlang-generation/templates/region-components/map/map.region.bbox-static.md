---
templateId: region.map.bbox-static
componentType: region
version: 1.0
imports:
  - map._common.md
description: Map region scenario with static bounding-box constraints.
---

# Purpose

Document static bounding-box authoring for map regions.

---

# Variable Contract

## Required Variables

- `regionStaticId`
- `name`
- `layout.sequence`
- `layout.slot`
- `boundingBox.type` (use `staticValues`)
- `boundingBox.minLongitude`
- `boundingBox.minLatitude`
- `boundingBox.maxLongitude`
- `boundingBox.maxLatitude`

## Optional Variables

- `boundingBox.currentBoundsItem`
- `map.height`

---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: map
  map {
    height: {{map.height}}
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  boundingBox {
    type: staticValues
    minLongitude: {{boundingBox.minLongitude}}
    minLatitude: {{boundingBox.minLatitude}}
    maxLongitude: {{boundingBox.maxLongitude}}
    maxLatitude: {{boundingBox.maxLatitude}}
    currentBoundsItem: {{boundingBox.currentBoundsItem}}
  }
)
```

---

# Guardrails

- Use bbox metadata only when `mapFeatures` does not include `infiniteMap`.
- Use this scenario when the viewport limits are fixed constants rather than data-derived.
