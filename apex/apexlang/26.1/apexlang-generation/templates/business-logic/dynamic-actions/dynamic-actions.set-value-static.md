---
templateId: dynamic-actions.set-value-static
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Set item value using a static literal.
---

# Purpose

Assign static values to items when a trigger event occurs.

---

# Output Template – Minimal
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
            type: static
            value: {{settings.value}}
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
  - `settings.type: static`
  - `settings.value`
- Optional:
  - none
- Forbidden:
  - `setType`
  - `settings.type: sqlStatement`
  - `settings.staticValue`

# Conditional Rendering Rules

- Provide `affectedElements` selectors for all items requiring the static value.
- Remove unused selection fields when using selectors (`jQuerySelector`).
- Combine with additional actions if multiple values must be set.

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
