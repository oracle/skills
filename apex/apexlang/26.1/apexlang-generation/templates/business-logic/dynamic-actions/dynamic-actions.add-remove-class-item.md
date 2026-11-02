---
templateId: dynamic-actions.add-remove-class-item
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Add or remove a CSS class on a single item.
---

# Purpose

Toggle validation styling on a specific item when focus leaves the field and the item value is empty.

---

# Output Template – Full
```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: focusout
        selectionType: items
        items: {{when.item}}
    }
    clientSideCondition {
        type: itemIsNull
        item: {{clientSideCondition.item}}
    }
    action {{actionAdd.name}} (
        action: addClass
        settings {
            class: {{settings.class}}
        }
        affectedElements {
            selectionType: items
            items: {{affectedElements.item}}
        }
        execution {
            sequence: {{actionAdd.execution.sequence}}
            event: @{{dynamicActionStaticId}}
        }
    )
    action {{actionRemove.name}} (
        action: removeClass
        settings {
            class: {{settings.class}}
        }
        affectedElements {
            selectionType: items
            items: {{affectedElements.item}}
        }
        execution {
            sequence: {{actionRemove.execution.sequence}}
            event: @{{dynamicActionStaticId}}
            fireWhenEventResultIs: false
        }
    )
)
```

---

# Settings Contract

- Required:
  - `settings.class`
- Optional:
  - none
- Forbidden:
  - `setType`
  - `settings.code`

# Conditional Rendering Rules

- Swap the event or selection type to target different triggers (e.g., `change`).
- Remove the second action when class removal is unnecessary.
- Update `clientSideCondition` when using non-empty checks or other comparisons.

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
