---
templateId: region.map.layer.common
componentType: region
version: 1.0
imports:
  - map._common.md
description: Shared layer contract for Oracle APEX map regions using the attached declarative layer structure.
---

# Purpose

Standardize `layer` variable contracts, output shape, geometry rules, popup behavior, and source-mode choices for all map-layer scenarios while keeping the standard structure aligned with `MapsLang.apx`.

---

# Generation Rules (MANDATORY)

1. Load `map._common.md` before using this layer contract.
2. Use this file for shared layer rules; keep layer-type-specific behavior in `map.layer.*.md`.
3. Keep region-level concerns such as tile-layer selection, bbox, and initial position in the region scenario files.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| `name` | yes | string | Unique within the parent map region. |
| `staticId` | yes | string | Identifier used after the `layer` keyword. |
| `layout.sequence` | yes | number | Region-owned layer order. |
| `source.tableName` | conditional | source | Table-backed source mode. Leave `source.type` unset for this canonical simple path. |
| `source.type` | conditional | enum | Required for typed non-table source modes. Supported values: `sqlQuery`, `functionBody`. |
| `source.sqlQuery` | conditional | sql | Required when `source.type: sqlQuery`. Legacy bare `source { sqlQuery: ... }` remains accepted for existing artifacts during transition, but new examples should emit the typed form. |
| `source.plsqlFunctionBody` | conditional | plsql | Required when `source.type: functionBody`. Must return SQL text and is an advanced fallback rather than the preferred default. |
| `columnMapping.geometryColumnDataType` | yes | enum | `longitudeLatitude`, `sdoGeometry`, or `geojson`. |
| `columnMapping.geometryColumn` / `columnMapping.longitudeColumn` / `columnMapping.latitudeColumn` | conditional | column | Shape depends on `geometryColumnDataType`. |
| `columnMapping.primaryKeyColumn` | optional | column | Stable feature identity when needed by the scenario. |
| `tooltip.column` | optional | column | Standard tooltip source for the layer. |
| scenario-specific properties | optional | mixed | Additional line, polygon, heat-map, or 3D properties belong in the dedicated layer scenario files. |

---

# Output Template – Table-Backed

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
    geometryColumn: {{layer.columnMapping.geometryColumn}}
    longitudeColumn: {{layer.columnMapping.longitudeColumn}}
    latitudeColumn: {{layer.columnMapping.latitudeColumn}}
    primaryKeyColumn: {{layer.columnMapping.primaryKeyColumn}}
  }
  tooltip {
    column: {{layer.tooltip.column}}
  }
)
```

## Output Template – Typed SQL Query

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
    geometryColumn: {{layer.columnMapping.geometryColumn}}
    longitudeColumn: {{layer.columnMapping.longitudeColumn}}
    latitudeColumn: {{layer.columnMapping.latitudeColumn}}
    primaryKeyColumn: {{layer.columnMapping.primaryKeyColumn}}
  }
  tooltip {
    column: {{layer.tooltip.column}}
  }
)
```

## Output Template – Function Body

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
    geometryColumn: {{layer.columnMapping.geometryColumn}}
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

# Source-Location Matrix

| Source shape | Main use | Key guardrails |
|-------------|----------|----------------|
| `source { tableName: ... }` | Simplest standard map layer | Preferred for the canonical pattern and remains untyped. |
| `source { type: sqlQuery sqlQuery: ... }` | Custom SQL-backed layer | Preferred emitted form for new SQL-backed map layers. Legacy bare `source { sqlQuery: ... }` is transitional compatibility only. |
| `source { type: functionBody plsqlFunctionBody: ... }` | Advanced function-backed layer | Use only when table-backed and plain SQL-backed layer sources cannot express the requirement cleanly. |

---

# Geometry Matrix

| Geometry type | Supported when | Notes |
|--------------|----------------|-------|
| `sdoGeometry` | Layers use a single spatial column | The column must contain spatial objects. |
| `geojson` | Layers use a single GeoJSON column | Column may be `VARCHAR2`, `CLOB`, or `BLOB`. |
| `longitudeLatitude` | Layers expose separate longitude and latitude columns | Standard point-map path in the attached canonical example. |

---

# Popup, Link, And Legend Rules

- Heat-map layers do not expose the normal tooltip, link, or info-window paths.
- Use `tooltip { column: ... }` as the default popup path for the attached-style standard layer.
- Context-sensitive SQL-backed layers must use live-valid refresh/session-state patterns for the active compiler. Do not emit unsupported map-layer `source.pageItemsToSubmit`, and do not use `v()`/`nv()` session-state reads as a workaround.
- Marker edit/open behavior must use a declarative layer `link` with target page and item mappings, backed by `columnMapping.primaryKeyColumn`.
- Keep line, polygon, and 3D display-specific metadata in the dedicated scenario templates rather than re-expanding the shared base layer shape.
- `functionBody` is supported for map layers, but it is an advanced escape hatch:
  - it must return SQL text
  - it must not perform DML or transaction control
  - prefer `tableName` first, then typed `sqlQuery`, and use `functionBody` only when those two modes are insufficient

---

# Vector-Tile Guardrails

- Advanced vector-tile-specific properties are intentionally omitted from the attached canonical standard layer shape.
- If a future runtime or import requirement needs them back, restore them in a dedicated advanced map-layer scenario instead of widening the standard attached-style template.

---

# Source Anchors

- `core/apex_install_pe_data.sql`
- `core/wwv_flow_imp_page.sql`
- `core/gen_api_pkg.plb`
- `images/apex_ui/js/pe.callbacks.js`
