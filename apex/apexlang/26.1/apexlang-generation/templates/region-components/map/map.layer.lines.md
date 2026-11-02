---
templateId: region.map.layer.lines
componentType: region
version: 1.0
imports:
  - map._common.md
  - map.layer._common.md
description: Line-layer guidance for Oracle APEX Maps.
---

# Purpose

Document line-layer behavior for Maps: line geometry mapping, stroke styling, color-value mapping, and popup behavior for linear features.

---

# Variable Contract

## Required Variables

- `layer.staticId`
- `layer.name`
- `layer.layerType` (use `lines`)
- `layer.layout.sequence`
- `layer.source.tableName`
- `layer.columnMapping.geometryColumnDataType`

## Optional Variables

- `layer.appearance.strokeColor`
- `layer.appearance.strokeWidth`
- `layer.appearance.strokeStyle`
- `layer.appearance.colorValueColumn`

---

# Template

```apexlang
layer {{layer.staticId}} (
  name: {{layer.name}}
  layerType: lines
  layout {
    sequence: {{layer.layout.sequence}}
  }
  source {
    tableName: {{layer.source.tableName}}
    sqlQuery:
      ```sql
      {{layer.source.sqlQuery}}
      ```
  }
  columnMapping {
    geometryColumnDataType: {{layer.columnMapping.geometryColumnDataType}}
    geometryColumn: {{layer.columnMapping.geometryColumn}}
    primaryKeyColumn: {{layer.columnMapping.primaryKeyColumn}}
  }
  appearance {
    strokeColor: {{layer.appearance.strokeColor}}
    strokeWidth: {{layer.appearance.strokeWidth}}
    strokeStyle: {{layer.appearance.strokeStyle}}
    colorValueColumn: {{layer.appearance.colorValueColumn}}
  }
)
```

---

# Guardrails

- `geometryColumnDataType: longitudeLatitude` is not the intended line-layer path; prefer `sdoGeometry` or `geojson` for line geometry.
- Non-point runtime popups require explicit coordinates when opened through the JS API.
- Line layers can use tooltips, links, and info windows because those metadata paths are removed only for heat-map layers.
