---
templateId: region.map.layer.extruded-polygons
componentType: region
version: 1.0
imports:
  - map._common.md
  - map.layer._common.md
description: Extruded-polygon guidance for Oracle APEX Maps.
---

# Purpose

Document 3D polygon-layer behavior for Maps: extruded polygon geometry, height-by-value rendering, extrusion unit metadata, and polygon-style fill rules.

---

# Variable Contract

## Required Variables

- `layer.staticId`
- `layer.name`
- `layer.layerType` (use `extrudedPolygons`)
- `layer.layout.sequence`
- `layer.source.tableName`
- `layer.columnMapping.geometryColumnDataType`
- `layer.appearance.extrusionValueColumn`
- `layer.appearance.unit`

## Optional Variables

- `layer.appearance.fillColor`
- `layer.appearance.fillOpacity`
- `layer.appearance.strokeColor`
- `layer.appearance.strokeWidth`

---

# Template

```apexlang
layer {{layer.staticId}} (
  name: {{layer.name}}
  layerType: extrudedPolygons
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
    extrusionValueColumn: {{layer.appearance.extrusionValueColumn}}
    unit: {{layer.appearance.unit}}
    fillColor: {{layer.appearance.fillColor}}
    fillOpacity: {{layer.appearance.fillOpacity}}
    strokeColor: {{layer.appearance.strokeColor}}
    strokeWidth: {{layer.appearance.strokeWidth}}
  }
)
```

---

# Guardrails

- `appearance.extrusionValueColumn` is required for extruded polygons.
- `appearance.unit` becomes required once the extrusion value column is set.
- Use polygon geometry for the layer source; extrusion metadata is not a substitute for valid polygon geometry.
- Extruded polygons share the same fill-color-spectrum rules as normal polygon layers.
