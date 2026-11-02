---
templateId: region.map.layer.heat-map
componentType: region
version: 1.0
imports:
  - map._common.md
  - map.layer._common.md
description: Heat-map guidance for Oracle APEX Maps.
---

# Purpose

Document heat-map behavior for Maps: point-density rendering, heat-map color schemes, and the restrictions that remove normal tooltip, link, and info-window options from heat-map layers.

---

# Variable Contract

## Required Variables

- `layer.staticId`
- `layer.name`
- `layer.layerType` (use `heatMap`)
- `layer.layout.sequence`
- `layer.source.tableName`
- `layer.columnMapping.geometryColumnDataType`

## Optional Variables

- `layer.appearance.valueColumn`
- `layer.appearance.colorScheme`
- `layer.layerHeatmap*Name`
- `layer.appearance.customColorList`

---

# Template

```apexlang
layer {{layer.staticId}} (
  name: {{layer.name}}
  layerType: heatMap
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
    longitudeColumn: {{layer.columnMapping.longitudeColumn}}
    latitudeColumn: {{layer.columnMapping.latitudeColumn}}
    primaryKeyColumn: {{layer.columnMapping.primaryKeyColumn}}
  }
  appearance {
    valueColumn: {{layer.appearance.valueColumn}}
    colorScheme: {{layer.appearance.colorScheme}}
    schemeName: {{layer.appearance.schemeName}}
    customColorList: {{layer.appearance.customColorList}}
  }
)
```

---

# Guardrails

- Heat maps are point-only in practice. If the source uses `sdoGeometry` or `geojson`, it must still return point objects.
- Heat-map layers do not expose the normal tooltip, link-target, or info-window metadata paths.
- `appearance.valueColumn` is optional. Without it, the widget derives color intensity from point density alone.
- Use high-contrast color ramps and avoid problematic red-green-only schemes.
