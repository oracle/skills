---
templateId: dynamic-actions.add-remove-class
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Add or remove CSS classes declaratively.
---

# Purpose

Toggle CSS classes on target elements in response to user events (buttons, regions, items).

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
        selectionType: {{when.selectionType}}
        button: @{{when.button}}
        region: {{when.region}}
        item: {{when.item}}
    }
    action {{action.name}} (
        action: addClass
        settings {
            class: {{settings.class}}
        }
        affectedElements {
            selectionType: {{affectedElements.selectionType}}
            region: {{affectedElements.region}}
            item: {{affectedElements.item}}
            jquerySelector: {{affectedElements.jQuerySelector}}
        }
        execution {
            sequence: {{action.execution.sequence}}
            event: {{action.execution.event}}
            fireOnInit: false
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

- Use `action: removeClass` or duplicate the action block to support both add/remove behaviours.
- Provide the affectedElements field that matches the selection type (omit unused fields).
- Remove `settings.class` when targeting actions that do not require a class name.
- If `selectionType: button`, keep `when.button` in alias format (`@button-static-id`).
- Keep `fireOnInit: false` unless initialization behavior is explicitly requested.

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
