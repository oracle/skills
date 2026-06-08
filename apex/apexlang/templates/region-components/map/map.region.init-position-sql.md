---
templateId: region.map.init-position-sql
componentType: region
version: 1.0
imports:
  - map._common.md
description: Map region scenario with SQL-driven `initialPositionAndZoom` metadata.
---

# Purpose

Document SQL-driven initial positioning for map regions using the attached `initialPositionAndZoom` block shape.

---

# Variable Contract

## Required Variables

- `regionStaticId`
- `name`
- `layout.sequence`
- `layout.slot`
- `initialPositionAndZoom.sqlQuery`
- `initialPositionAndZoom.geometryColumnDataType`

## Optional Variables

- `initialPositionAndZoom.initialGeometrySdogeomColumn`
- `initialPositionAndZoom.initialGeometryGeojsonColumn`
- `initialPositionAndZoom.initialLongitudeColumn`
- `initialPositionAndZoom.initialLatitudeColumn`
- `initialPositionAndZoom.initialZoomlevelColumn`
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
  initialPositionAndZoom {
    type: sqlQuery
    sqlQuery:
      ```sql
      {{initialPositionAndZoom.sqlQuery}}
      ```
    geometryColumnDataType: {{initialPositionAndZoom.geometryColumnDataType}}
    initialGeometrySdogeomColumn: {{initialPositionAndZoom.initialGeometrySdogeomColumn}}
    initialGeometryGeojsonColumn: {{initialPositionAndZoom.initialGeometryGeojsonColumn}}
    initialLongitudeColumn: {{initialPositionAndZoom.initialLongitudeColumn}}
    initialLatitudeColumn: {{initialPositionAndZoom.initialLatitudeColumn}}
    initialZoomlevelColumn: {{initialPositionAndZoom.initialZoomlevelColumn}}
  }
)
```

---

# Guardrails

- `geometryColumnDataType: sdoGeometry` requires `initialGeometrySdogeomColumn`.
- `geometryColumnDataType: geojson` requires `initialGeometryGeojsonColumn`.
- `geometryColumnDataType: longitudeLatitude` requires `initialLongitudeColumn` and `initialLatitudeColumn`.
- For `type: sqlQuery`, the SQL select list must expose aliases that exactly match each configured `initial*Column` property.
- `initialZoomlevelColumn` is optional in SQL mode, but when present the SQL must return that alias explicitly.
- Do not use this scenario to center a multi-marker map on `avg(latitude)` / `avg(longitude)` with a fixed zoom. For store/customer/location maps with more than one marker, use SQL-derived `boundingBox` instead so the initial viewport fits the data.
- Use fixed zoom only for a requirement-backed single known geography or one-location map.
