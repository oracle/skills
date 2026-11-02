---
templateId: dynamic-actions.set-value-plsql-function
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Set item value using a PL/SQL function.
---

# Purpose

Populate items by executing PL/SQL functions on the server and returning the result.

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
        settings {
            type: plsqlFunctionBody
            plsqlFunctionBody:
                ```plsql
                {{settings.plsqlFunctionBody}}
                ```
            itemsToSubmit: {{settings.itemsToSubmit}}
        }
        affectedElements {
            selectionType: items
            items: {{affectedElements.item}}
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
  - `settings.type: plsqlFunctionBody`
  - `settings.plsqlFunctionBody`
- Optional:
  - `settings.itemsToSubmit` when bind variables are referenced
- Forbidden:
  - `setType`
  - `settings.type: sqlStatement`

# Conditional Rendering Rules

- Provide `itemsToSubmit` for bind variables referenced in the PL/SQL function.
- Keep PL/SQL idempotent; move heavy logic to packaged APIs as needed.
- Remove the action when using alternate setValue types (static or SQL).

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
