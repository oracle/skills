---
templateId: dynamic-actions.execution-debounce-throttle
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Debounce or throttle dynamic action execution.
---

# Purpose

Delay or limit how frequently a dynamic action fires (e.g., while typing).

---

# Output Template – Full
```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
        type: {{execution.type}}
        time: {{execution.time}}
        immediate: {{execution.immediate}}
    }
    when {
        event: {{when.event}}
        selectionType: items
        items: {{when.item}}
    }
    action {{action.name}} (
        action: {{action.action}}
        affectedElements {
            selectionType: {{affectedElements.selectionType}}
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
  - `execution.type` (`debounce` or `throttle`)
  - `execution.time` (milliseconds)
- Optional:
  - `execution.immediate` (boolean)
  - action-specific settings only when the selected action type requires them
- Forbidden:
  - `setType`
  - `settings.code`
  - `execution.debounce.delay`
  - `execution.throttle.delay`

# Conditional Rendering Rules

- Use exactly one execution `type` (`debounce` or `throttle`) per dynamic action.
- Render `time` only when execution type is `debounce` or `throttle`.
- Render `immediate` only when execution type is `debounce` or `throttle` and a value is provided.
- Ensure the event supports repeat firing (e.g., `keyup`).
- Combine with `setValue` or `refresh` actions to optimize server calls.

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
