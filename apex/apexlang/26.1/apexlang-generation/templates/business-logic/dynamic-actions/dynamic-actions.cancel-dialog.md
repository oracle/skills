---
templateId: dynamic-actions.cancel-dialog
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Cancel a dialog from dynamic action or triggerAction flows.
---

# Purpose

Close/cancel dialog interaction declaratively from client-side events, typically from a Cancel button, without submit-bound processing.

---

# Output Template – Minimal

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

    action {{action.name}} (
        action: cancelDialog
        execution {
            sequence: {{action.execution.sequence}}
            event: @{{dynamicActionStaticId}}
            fireOnInit: false
        }
    )
)
```

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
    clientSideCondition {
        type: {{clientSideCondition.type}}
        item: {{clientSideCondition.item}}
        value: {{clientSideCondition.value}}
    }
    serverSideCondition {
        type: {{serverSideCondition.type}}
        item: {{serverSideCondition.item}}
        {{serverSideCondition.comparisonAttribute}}: {{serverSideCondition.comparisonValue}}
    }

    action {{action.name}} (
        action: cancelDialog
        execution {
            sequence: {{action.execution.sequence}}
            event: @{{dynamicActionStaticId}}
            fireOnInit: false
        }
        serverSideCondition {
            type: {{action.serverSideCondition.type}}
            item: {{action.serverSideCondition.item}}
            {{action.serverSideCondition.comparisonAttribute}}: {{action.serverSideCondition.comparisonValue}}
        }
    )
)
```

---

# Settings Contract

- Required:
  - none for `cancelDialog` action payload
- Optional:
  - action-level/server-level condition blocks
- Forbidden:
  - `settings.plsqlCode`, `settings.sqlQuery`, `settings.value`, or arbitrary settings for this action

---

# Event & Execution Semantics

- Canonical trigger is button click (`selectionType: button`).
- `cancelDialog` should not be used to simulate successful submit completion.
- Keep `fireOnInit: false` to prevent auto-cancel at load.

---

# Conditional Rendering Rules

- If the page already uses button `triggerAction action: cancelDialog`, keep that style when updating in-place.
- Use dynamic action form when cancel behavior is shared across conditions or needs extra pre-check logic.
- Use `closeDialog` process for post-submit success closure, not `cancelDialog`.
- Set `comparisonAttribute` to `list` for item colon-list membership types; otherwise use `value`.

---

# Validation Checklist

- Action is exactly `cancelDialog`.
- Trigger button alias is in `@alias` format.
- No unsupported settings block is present.
- Flow does not unintentionally bypass required submit/save behavior.

---

# Source-Aligned Example

Canonical cancel-dialog example in this template family:

```
button cancel (
    behavior {
        action: triggerAction
    }

    triggerAction native-dialog-cancel (
        action: cancelDialog
        execution {
            sequence: 10
        }
    )
)
```
