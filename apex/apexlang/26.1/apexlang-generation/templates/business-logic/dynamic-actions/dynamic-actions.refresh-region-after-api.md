---
templateId: dynamic-actions.refresh-region-after-api
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
version: 1.0
description: Refresh region after API success event.
---

# Purpose

Refresh a target region after a custom event (e.g., API success) is fired.

---

# Output Template – Minimal
```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: custom
        customEvent: {{when.customEvent}}
        selectionType: region
        region: @{{when.region}}
    }
    action {{action.name}} (
        action: refresh
        affectedElements {
            selectionType: region
            region: @{{affectedElements.region}}
        }
        execution {
            sequence: {{action.execution.sequence}}
            event: @{{action.execution.event}}
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

- Set `customEvent` to the event published by your API (e.g., `apiSuccess`).
- Include `itemsToSubmit` if the refresh requires refreshed session state.
- Remove `customEvent` when using built-in events.

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
