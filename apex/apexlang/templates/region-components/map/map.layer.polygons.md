---
templateId: region.map.layer.polygons
componentType: region
version: 1.0
imports:
  - map._common.md
  - map.layer._common.md
description: Polygon-layer guidance for Oracle APEX Maps.
---

# Purpose

Document 2D polygon-layer behavior for Maps: polygon geometry, static fill and stroke, spectrum-driven color schemes, legend behavior, and tooltip or info-window paths.

---

# Variable Contract

## Required Variables

- `layer.staticId`
- `layer.name`
- `layer.layerType` (use `polygons`)
- `layer.layout.sequence`
- `layer.source.tableName`
- `layer.columnMapping.geometryColumnDataType`

## Optional Variables

- `layer.appearance.useColorScheme`
- `layer.appearance.colorScheme`
- `layer.layerColorSpectrum*Name`
- `layer.featureFillColorSpectrum`
- `layer.appearance.colorValueColumn`
- `layer.appearance.fillColor`
- `layer.appearance.fillOpacity`
- `layer.appearance.strokeColor`
- `layer.appearance.strokeWidth`
- `layer.appearance.strokeStyle`
- `layer.mapFeatureLegendAdvFormatting`
- `layer.mapFeatureLegendHtmlExpr`

---

# Template

```apexlang
layer {{layer.staticId}} (
  name: {{layer.name}}
  layerType: polygons
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
    useColorScheme: {{layer.appearance.useColorScheme}}
    colorScheme: {{layer.appearance.colorScheme}}
    schemeName: {{layer.appearance.schemeName}}
    colorValueColumn: {{layer.appearance.colorValueColumn}}
    fillColor: {{layer.appearance.fillColor}}
    fillOpacity: {{layer.appearance.fillOpacity}}
    strokeColor: {{layer.appearance.strokeColor}}
    strokeWidth: {{layer.appearance.strokeWidth}}
    strokeStyle: {{layer.appearance.strokeStyle}}
  }
)
```

---

# Guardrails

- Spectrum-driven fill on polygons requires a numeric `appearance.colorValueColumn`.
- When spectrum mode is off, the layer falls back to static `appearance.fillColor`.
- Keep contrast between polygon fill, stroke, and the underlying basemap high enough for clear differentiation.
