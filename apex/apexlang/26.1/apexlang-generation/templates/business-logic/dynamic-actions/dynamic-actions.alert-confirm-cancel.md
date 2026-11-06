---
templateId: dynamic-actions.alert-confirm-cancel
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Display a confirmation dialog with optional cancel handling.
---

# Purpose

Prompt users with a confirmation dialog before executing further actions (e.g., deletion).

---

# Output Template – Full
```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: click
        selectionType: button
        button: @{{when.button}}
    }
    action {{actionConfirm.name}} (
        action: alert
        settings {
            title: {{settings.title}}
            message: {{settings.message}}
            style: confirmation
        }
        execution {
            sequence: {{actionConfirm.execution.sequence}}
            event: {{actionConfirm.execution.event}}
            fireOnInit: false
        }
    )
)
```

---

# Settings Contract

- Required:
  - `settings.title`
  - `settings.message`
- Optional:
  - `settings.style` when action supports style variants
- Forbidden:
  - `settings.code`
  - raw button names in `when.button` (must use `@button-static-id`)

# Event & Execution Semantics

- Use `action: confirm` when you need explicit true/false branching.
- Use `fireWhenEventResultIs: false` for cancel-branch actions only.
- Keep `fireOnInit: false` for all confirm/cancel chain actions unless explicitly requested.

# Conditional Rendering Rules

- Replace `action: alert` with `action: confirm` when requiring separate OK/Cancel callbacks.
- Chain follow-up actions (e.g., `executeServerSideCode`) by adding additional action blocks with appropriate `fireWhenEventResultIs` values.
- Remove `button` selection when triggering from items or regions.
- Keep `when.button` in alias format (for example `@cancel-claim`).
- Keep `fireOnInit: false` unless initialization behavior is explicitly requested.
- For modal cancel behavior, prefer `dynamic-actions.cancel-dialog.md`.

# Validation Checklist

- Confirm vs alert selection matches required branching behavior.
- `fireWhenEventResultIs` appears only on branch-specific actions.
- No raw button names are used in trigger selectors.
