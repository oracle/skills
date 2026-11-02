---
templateId: region.map.standard
componentType: region
version: 1.0
imports:
  - map._common.md
  - map.layer._common.md
description: Standard map region with one declarative table-backed point layer using the attached map structure.
---

# Purpose

Baseline map-region scenario for the default authoring path: a single declarative point layer using `initialPositionAndZoom`, table-backed `source { tableName: ... }`, and `geometryColumnDataType: longitudeLatitude`.

---

# Generation Rules (MANDATORY)

1. Load `map._common.md`, `map.layer._common.md`, and `references/policies/memory-bank/30-pages/apex.map-page.md` before use.
2. Use this template only for the simplest table-backed point-map flow.
3. Move bbox, SQL-driven initial position, shared backgrounds, browser-location behavior, and non-point layers into the dedicated scenario files.
4. For `initialPositionAndZoom.type: sqlQuery`, make the SQL select-list aliases exactly match the emitted `initialLongitudeColumn`, `initialLatitudeColumn`, and optional `initialZoomlevelColumn` names.

---

# Variable Contract

## Required Variables

- `regionStaticId`
- `name`
- `layout.sequence`
- `layout.slot`
- `initialPositionAndZoom.sqlQuery`
- `initialPositionAndZoom.geometryColumnDataType`
- `initialPositionAndZoom.initialLongitudeColumn`
- `initialPositionAndZoom.initialLatitudeColumn`
- `layer.staticId`
- `layer.name`
- `layer.layout.sequence`
- `layer.source.tableName`
- `layer.columnMapping.geometryColumnDataType`
- `layer.columnMapping.longitudeColumn`
- `layer.columnMapping.latitudeColumn`

## Optional Variables

- `map.height`
- `controls.options`
- `attributes.messagesPosition`
- `tooltip.column`

Use `map.layer.points.sql-query.md` or `map.layer.points.function-body.md` when the point layer source is not table-backed.

---

# Output Template

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
  appearance {
    template: @/standard
    templateOptions: #DEFAULT#
  }
  controls {
    options: {{controls.options}}
  }
  initialPositionAndZoom {
    type: sqlQuery
    sqlQuery:
      ```sql
      {{initialPositionAndZoom.sqlQuery}}
      ```
    geometryColumnDataType: {{initialPositionAndZoom.geometryColumnDataType}}
    initialLongitudeColumn: {{initialPositionAndZoom.initialLongitudeColumn}}
    initialLatitudeColumn: {{initialPositionAndZoom.initialLatitudeColumn}}
    initialZoomlevelColumn: {{initialPositionAndZoom.initialZoomlevelColumn}}
  }
  attributes {
    messagesPosition: {{attributes.messagesPosition}}
  }
  layer {{layer.staticId}} (
    name: {{layer.name}}
    layout {
      sequence: {{layer.layout.sequence}}
    }
    source {
      tableName: {{layer.source.tableName}}
    }
    columnMapping {
      geometryColumnDataType: {{layer.columnMapping.geometryColumnDataType}}
      longitudeColumn: {{layer.columnMapping.longitudeColumn}}
      latitudeColumn: {{layer.columnMapping.latitudeColumn}}
    }
    tooltip {
      column: {{tooltip.column}}
    }
  )
)
```

---

# Conditional Rendering Rules

- Omit `map` when the default map height is acceptable.
- Omit `controls` when no control options are requested.
- Use `map.region.*.md` files for region-level edge cases.
- Use `map.layer.*.md` files for point, line, polygon, heat-map, or extruded-polygon details beyond this baseline.
- Keep this standard scenario table-backed. For non-table point layers, switch to the dedicated typed SQL or function-body point-layer scenarios instead of widening this baseline example.
- Keep SQL-driven initial position metadata and the SQL select-list synchronized. `initialZoomlevelColumn` stays optional, but if emitted it must match a returned alias.
