---
templateId: dynamic-actions.set-focus-on-ready
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Set focus when the page or region initializes.
---

# Purpose

Set keyboard focus to a specific item when the page renders (`ready` event).

---

# Output Template – Minimal
```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: ready
    }
    action {{action.name}} (
        action: setFocus
        affectedElements {
            selectionType: items
            items: {{affectedElements.item}}
        }
        execution {
            sequence: {{action.execution.sequence}}
        }
    )
)
```

---

# Settings Contract

- Required:
  - none
- Optional:
  - action-specific settings only when the selected action type requires them
- Forbidden:
  - `setType`
  - `settings.code`

# Conditional Rendering Rules

- Change the affected element selection to `jQuerySelector` when targeting complex nodes.
- Remove `fireOnInit` when focus should only be applied after user interaction.
- Ensure the target item is visible/enabled when focus is applied.

# Event & Execution Semantics

- `event: ready` is the initialization mechanism for this template, so omit `when.selectionType`.
- Do not emit action-level `execution.event`; the action inherits the parent dynamic action trigger.
- Do not add `fireOnInit` here; `event: ready` already provides page-load execution.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
