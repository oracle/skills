---
templateId: region.map.layer.points.function-body
componentType: region
version: 1.0
imports:
  - map._common.md
  - map.layer._common.md
  - map.layer.points.md
description: Advanced point-layer scenario for Oracle APEX Maps when the child layer source is a PL/SQL function body that returns SQL text.
---

# Purpose

Document the advanced fallback form for point layers that need `source.type: functionBody` with `source.plsqlFunctionBody`.

---

# Template

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

- This is an advanced, discouraged fallback rather than a standard baseline.
- The PL/SQL function body must return SQL text.
- Do not perform DML or transaction control in `plsqlFunctionBody`.
- Prefer `tableName` first, then typed `sqlQuery`, and use `functionBody` only when those modes are insufficient.
