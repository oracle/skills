---
templateId: dynamic-actions.refresh-region-on-change
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Refresh a region when an item value changes.
---

# Purpose

Refresh a report or region when filter item values change.

---

# Output Template – Minimal
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
    action {{action.name}} (
        action: refresh
        affectedElements {
            selectionType: region
            region: @{{affectedElements.region}}
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

- Submit the filter items so refreshed regions see the new values.
- Adjust the event to `keyup` for live search experiences.
- Remove the action when using separate refresh actions per target region.

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
