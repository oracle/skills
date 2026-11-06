---
templateId: dynamic-actions.set-value-sql
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
version: 1.0
description: Set item value using SQL query.
---

# Purpose

Populate items using SQL queries executed via dynamic actions.

---

# Output Template – Full
```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: {{when.event}}
        selectionType: items
        items: {{when.item}}
    }
    action {{action.name}} (
        action: setValue
        affectedElements {
            selectionType: items
            items: {{affectedElements.item}}
        }
        settings {
            type: sqlQuery
            itemsToSubmit: {{settings.itemsToSubmit}}
            sqlQuery:
                ```sql
                {{settings.sqlQuery}}
                ```
        }
        execution {
            sequence: {{action.execution.sequence}}
            event: {{action.execution.event}}
        }
    )
)
```

---

# Settings Contract

- Required:
  - `settings.type: sqlQuery`
  - `settings.sqlQuery`
- Optional:
  - `settings.itemsToSubmit` when bind variables are referenced
- Forbidden:
  - `setType`
  - `settings.type: sqlStatement`

# Conditional Rendering Rules

- Supply `itemsToSubmit` for bind variables referenced in the SQL.
- Remove `itemsToSubmit` when the query does not rely on item values.
- Use `fireOnInit: true` when the value must be set on page load.

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
