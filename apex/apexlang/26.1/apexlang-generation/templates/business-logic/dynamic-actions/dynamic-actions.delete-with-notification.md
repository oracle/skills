---
templateId: dynamic-actions.delete-with-notification
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Confirm deletion and show success notification.
---

# Purpose

Provide a confirm-delete pattern that executes server-side code and displays a notification.

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
        action: confirm
        settings {
            message: {{settings.message}}
            title: {{settings.title}}
        }
        execution {
            sequence: 10
            event: {{actionConfirm.execution.event}}
            fireOnInit: false
        }
    )

    action {{actionExecute.name}} (
        action: executeServerSideCode
        settings {
            itemsToSubmit: {{settings.itemsToSubmit}}
            plsqlCode:
                ```plsql
                {{settings.plsqlCode}}
                ```
        }
        execution {
            sequence: 20
            event: {{actionExecute.execution.event}}
            fireOnInit: false
        }
    )

    action {{actionNotify.name}} (
        action: showSuccessMessage
        settings {
            message: {{settings.successMessage}}
        }
        execution {
            sequence: 30
            event: {{actionNotify.execution.event}}
            fireOnInit: false
        }
    )
)
```

---

# Settings Contract

- Required:
  - Confirm action: `settings.message`, `settings.title`
  - Execute action: `settings.plsqlCode`
  - Success action: `settings.successMessage`
- Optional:
  - Execute action: `settings.itemsToSubmit` when bind variables are referenced
- Forbidden:
  - `settings.code`
  - raw button names in `when.button` (must use `@button-static-id`)

# Conditional Rendering Rules

- Provide `itemsToSubmit` for server-side code when referencing page items.
- Add `fireWhenEventResultIs: false` actions for cancel flows if required.
- Remove the notification action when success messaging is handled elsewhere.
- Keep `when.button` in alias format (for example `@cancel-claim`).
- Keep `fireOnInit: false` unless initialization behavior is explicitly requested.

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
