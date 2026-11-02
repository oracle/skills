---
templateId: region.map.layer.points
componentType: region
version: 1.0
imports:
  - map._common.md
  - map.layer._common.md
description: Point-layer guidance for Oracle APEX Maps using the attached declarative layer structure.
---

# Purpose

Document point-layer behavior on Maps using the simpler declarative layer structure from `MapsLang.apx`.

---

# Variable Contract

## Required Variables

- `layer.staticId`
- `layer.name`
- `layer.layout.sequence`
- `layer.columnMapping.geometryColumnDataType`
- `layer.columnMapping.longitudeColumn`
- `layer.columnMapping.latitudeColumn`

## Optional Variables

- `layer.source.tableName`
- `layer.source.type`
- `layer.tooltip.column`
- `layer.source.sqlQuery`
- `layer.source.plsqlFunctionBody`
- `layer.columnMapping.primaryKeyColumn`

---

# Templates

## Table-Backed Point Layer

```apexlang
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
    primaryKeyColumn: {{layer.columnMapping.primaryKeyColumn}}
  }
  tooltip {
    column: {{layer.tooltip.column}}
  }
)
```

## Typed SQL Point Layer

```apexlang
layer {{layer.staticId}} (
  name: {{layer.name}}
  layout {
    sequence: {{layer.layout.sequence}}
  }
  source {
    type: sqlQuery
    sqlQuery:
      ```sql
      {{layer.source.sqlQuery}}
      ```
  }
  columnMapping {
    geometryColumnDataType: {{layer.columnMapping.geometryColumnDataType}}
    longitudeColumn: {{layer.columnMapping.longitudeColumn}}
    latitudeColumn: {{layer.columnMapping.latitudeColumn}}
    primaryKeyColumn: {{layer.columnMapping.primaryKeyColumn}}
  }
  tooltip {
    column: {{layer.tooltip.column}}
  }
)
```

## Function-Body Point Layer

```apexlang
layer {{layer.staticId}} (
  name: {{layer.name}}
  layout {
    sequence: {{layer.layout.sequence}}
  }
  source {
    type: functionBody
    plsqlFunctionBody:
      ```plsql
      {{layer.source.plsqlFunctionBody}}
      ```
  }
  columnMapping {
    geometryColumnDataType: {{layer.columnMapping.geometryColumnDataType}}
    longitudeColumn: {{layer.columnMapping.longitudeColumn}}
    latitudeColumn: {{layer.columnMapping.latitudeColumn}}
    primaryKeyColumn: {{layer.columnMapping.primaryKeyColumn}}
  }
  tooltip {
    column: {{layer.tooltip.column}}
  }
)
```

---

# Guardrails

- Prefer the simpler attached-style layer shape for standard point maps: `layout`, `source`, `columnMapping`, and optional `tooltip`.
- Use `geometryColumnDataType: longitudeLatitude` when the source exposes separate longitude and latitude columns.
- Prefer `tableName` for the standard path.
- Prefer `source.type: sqlQuery` for new SQL-backed point layers instead of the older bare `source.sqlQuery` shape.
- Treat `source.type: functionBody` as advanced and discouraged; use it only when table-backed and plain SQL-backed sources cannot represent the requirement.
- Keep icon, clustering, and other advanced display behavior out of the standard point-layer template unless the request explicitly requires those options.
