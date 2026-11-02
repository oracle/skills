---
templateId: region.map.bbox-sql
componentType: region
version: 1.0
imports:
  - map._common.md
description: Map region scenario with SQL-derived bounding-box constraints.
---

# Purpose

Document SQL-derived bounding-box authoring for map regions.

---

# Variable Contract

## Required Variables

- `regionStaticId`
- `name`
- `layout.sequence`
- `layout.slot`
- `boundingBox.type` (use `sqlQuery`)
- `boundingBox.sqlQuery`
- `boundingBox.geometryColumnDataType`

## Optional Variables

- `boundingBox.geometryColumn`
- `boundingBox.minLongitude`
- `boundingBox.minLatitude`
- `boundingBox.maxLongitude`
- `boundingBox.maxLatitude`
- `boundingBox.currentBoundsItem`

---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: map
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  boundingBox {
    type: sqlQuery
    sqlQuery:
    ```sql
    {{boundingBox.sqlQuery}}
    ```
    geometryColumnDataType: {{boundingBox.geometryColumnDataType}}
    geometryColumn: {{boundingBox.geometryColumn}}
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

- `boundingBox.geometryColumnDataType: sdoGeometry` requires `boundingBox.geometryColumn`.
- `boundingBox.geometryColumnDataType: longitudeLatitude` requires the min/max longitude and latitude column set.
- Use bbox metadata only when `mapFeatures` does not include `infiniteMap`.
- Use this scenario as the default viewport strategy for multi-marker longitude/latitude maps. Source the bounds from the same filtered dataset as the visible layer, for example `min(longitude)`, `min(latitude)`, `max(longitude)`, and `max(latitude)`.
- Do not replace this with an `initialPositionAndZoom` query that returns `avg(longitude)`, `avg(latitude)`, and a fixed zoom level unless the requirements explicitly specify one known geography.
