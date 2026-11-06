---
templateId: computations.sql-multi
componentType: computation
version: 1.0
imports:
  - computations._common
description: Multi-value SQL computation template.
---

# Purpose

Use when a computation returns multiple values.

Supported patterns:
- Populate several target items from one row via `assignValue` mappings.
- Populate one multi-value item (for example `checkboxGroup`, `selectMany`, or `shuttle`) by returning one row per selected value and letting the item's multiple-values settings determine the stored shape.

---

# Output Template – Full
```
computation {{computationStaticId}} (
    name: {{computationName}}
    location: {{location}}
    computationPoint: {{computationPoint}}
    type: sqlQueryMultipleValues
    sqlQuery:
        ```sql
        {{sqlQuery}}
        ```
    assignValue (
        item: {{assignValue.item}}
        column: {{assignValue.column}}
    )
    assignValue (
        item: {{assignValue2.item}}
        column: {{assignValue2.column}}
    )
)
```

---

# Output Template – Single Multi-Value Item
```
computation {{computationStaticId}} (
    name: {{computationName}}
    location: {{location}}
    computationPoint: {{computationPoint}}
    type: sqlQueryMultipleValues
    item: {{item}}
    sqlQuery:
        ```sql
        {{sqlQuery}}
        ```
)
```

---

# Conditional Rendering Rules

- Include one `assignValue` block per output column.
- Ensure the SQL query aliases columns exactly as referenced by `assignValue.column`.
- When targeting one multi-value item, return one row per selected value and omit `assignValue`.
- Do not pre-aggregate with `listagg` unless the target item's multiple-values storage settings explicitly require that output shape.
- Submit dependent items before the computation executes when sourcing from other items.
