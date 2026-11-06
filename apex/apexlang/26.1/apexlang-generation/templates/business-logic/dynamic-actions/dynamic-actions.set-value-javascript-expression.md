---
templateId: dynamic-actions.set-value-javascript-expression
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Set item value using a JavaScript expression.
---

# Purpose

Compute and assign values on the client using JavaScript expressions.

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
            type: javaScriptExpression
            javaScriptExpression: {{settings.javaScriptExpression}}
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
  - `settings.type: javaScriptExpression`
  - `settings.javaScriptExpression`
- Optional:
  - `settings.itemsToSubmit` only when a later server-side action needs submitted state
- Forbidden:
  - `setType`
  - `settings.type: sqlStatement`

# Conditional Rendering Rules

- Ensure the JS expression returns a scalar value compatible with the target item.
- Use `itemsToSubmit` only when server-side computations follow the action.
- Remove unused selection fields when targeting multiple items via selectors.

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
