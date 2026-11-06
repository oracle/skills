---
templateId: dynamic-actions.show-success-message
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Display a success notification to the user.
---

# Purpose

Show an inline success message after an action completes.

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
        action: showSuccessMessage
        settings {
            message: {{settings.message}}
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
  - `settings.message`
- Optional:
  - none
- Forbidden:
  - `settings.code`

# Conditional Rendering Rules

- Combine with other actions to reset items or refresh regions.
- Remove unused selection fields when triggering from buttons or regions.
- Prefer this action over custom JavaScript for messaging.

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
