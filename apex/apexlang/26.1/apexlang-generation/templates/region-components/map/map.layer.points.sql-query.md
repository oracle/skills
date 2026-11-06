---
templateId: region.map.layer.points.sql-query
componentType: region
version: 1.0
imports:
  - map._common.md
  - map.layer._common.md
  - map.layer.points.md
description: Point-layer scenario for Oracle APEX Maps when the child layer source is a typed SQL query.
---

# Purpose

Show the preferred emitted form for new SQL-backed point layers: `source.type: sqlQuery` plus `source.sqlQuery`.

---

# Template

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

---

# Guardrails

- Use this scenario when a map layer cannot be represented cleanly by one table name.
- Prefer this typed SQL form for new SQL-backed map layers instead of the older bare `source { sqlQuery: ... }` shape.
- Keep `columnMapping` and optional `tooltip` identical to the standard point-layer contract.
- If the layer depends on same-page context, use live-valid refresh/session-state behavior for the active compiler. Do not emit unsupported `source.pageItemsToSubmit` on map layers, and do not use `v()`/`nv()` session-state reads.
- When marker click/edit behavior is required, include `columnMapping.primaryKeyColumn` and a declarative `link { target: { page, items } }` that passes the marker primary key to the target form.
