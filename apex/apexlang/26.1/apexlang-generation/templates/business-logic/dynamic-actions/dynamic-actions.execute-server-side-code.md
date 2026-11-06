---
templateId: dynamic-actions.execute-server-side-code
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Execute PL/SQL code from a dynamic action.
---

# Purpose

Run server-side PL/SQL in response to client events.

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
        action: executeServerSideCode
        settings {
            itemsToSubmit: {{settings.itemsToSubmit}}
            plsqlCode:
                ```plsql
                {{settings.plsqlCode}}
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
  - `settings.plsqlCode`
- Optional:
  - `settings.itemsToSubmit` when referenced items are used in PL/SQL
- Forbidden:
  - `settings.code`

# Conditional Rendering Rules

- Provide `itemsToSubmit` for items referenced inside the PL/SQL block.
- Use `fireOnInit` when the server code must run on page load.
- Avoid heavy business logic; prefer packaged APIs.

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
