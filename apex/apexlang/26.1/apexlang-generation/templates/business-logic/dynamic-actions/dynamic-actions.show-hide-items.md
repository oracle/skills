---
templateId: dynamic-actions.show-hide-items
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Show or hide items based on controlling values.
---

# Purpose

Toggle item visibility based on the value of a controlling item.

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
    action {{actionShow.name}} (
        action: show
        affectedElements {
            selectionType: items
            items: {{affectedElements.item}}
        }
        execution {
            sequence: 10
            event: {{actionShow.execution.event}}
        }
    )
    action {{actionHide.name}} (
        action: hide
        affectedElements {
            selectionType: items
            items: {{affectedElements.item}}
        }
        execution {
            sequence: 20
            event: {{actionHide.execution.event}}
            fireWhenEventResultIs: false
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

- Adjust `clientSideCondition` to evaluate other states (equals a specific value, etc.).
- For branch-style behavior with `clientSideCondition`, keep both show and hide actions in the same DA.
- If one branch is intentionally omitted, explicitly document the reason in this scenario template.
- Expand `affectedElements` list when controlling multiple items.

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
