---
templateId: dynamic-actions.enable-disable-items
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Enable or disable form items declaratively.
---

# Purpose

Enable or disable target items based on the value of a controlling item.

---

# Output Template – Full
```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: change
        selectionType: items
        items: {{when.item}}
    }
    clientSideCondition {
        type: itemIsNotNull
        item: {{clientSideCondition.item}}
    }
    action {{action.name}} (
        action: enable
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
  - none
- Optional:
  - action-specific settings only when the selected action type requires them
- Forbidden:
  - `setType`
  - `settings.code`

# Conditional Rendering Rules

- Swap `action: enable` for `disable` as needed.
- Adjust `clientSideCondition` to evaluate different item states (e.g., equals specific value).
- Add additional actions to toggle multiple items.

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
