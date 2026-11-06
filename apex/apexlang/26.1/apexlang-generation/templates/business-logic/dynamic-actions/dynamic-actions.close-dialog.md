---
templateId: dynamic-actions.close-dialog
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Close dialog patterns with explicit client-action vs server-process separation.
---

# Purpose

Document `closeDialog` usage across dialog lifecycle patterns, with authoritative guidance on when to use a client action versus the server-side `process type: closeDialog`.

---

# Decision Rule

- Use process `type: closeDialog` for post-submit success closure.
- Use `action: closeDialog` only when explicit client-side closure is required (for example, non-submit close interaction).
- Do not replace canonical submit-close process pipelines with client-only close actions unless requested.

---

# Output Template – Client Action (Minimal)

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
        action: closeDialog
        execution {
            sequence: {{action.execution.sequence}}
            event: @{{dynamicActionStaticId}}
            fireOnInit: false
        }
    )
)
```

---

# Output Template – Server Process (Preferred Post-Submit)

Reference and align with `../processes/processes.close-dialog.md`:

```
process {{processStaticId}} (
    name: {{name}}
    type: closeDialog
    execution {
        sequence: {{execution.sequence}}
    }
    serverSideCondition {
        type: requestIsContainedInValue
        value: {{requestList}}
    }
)
```

---

# Settings Contract

- Required:
  - none for `action: closeDialog`
- Optional:
  - trigger/condition metadata around the action
  - process `serverSideCondition` request list for submit-bound closure
- Forbidden:
  - using `cancelDialog` and `closeDialog` interchangeably without lifecycle intent

---

# Event & Execution Semantics

- Client `action: closeDialog` is immediate UI behavior.
- Server `type: closeDialog` executes after submit pipeline and can be guarded by request/button.
- For CRUD modal forms, preferred order is:
  1. Submit event (`submitPage` or button submit)
  2. Validations/processes
  3. Process `type: closeDialog`
  4. Parent-page refresh DA on close (`apexafterclosedialog`)

---

# Conditional Rendering Rules

- If implementing submit/save in modal forms, include process closure rather than DA close action.
- Keep request list specific (`CREATE,SAVE,DELETE`) instead of broad unconditional closure where intent requires selectivity.
- Pair close patterns with parent refresh template `dynamic-actions.refresh-region-after-dialog.md`.

---

# Validation Checklist

- Close mechanism matches lifecycle intent (cancel vs close-after-submit).
- Post-submit closure uses process template unless user explicitly requires client-only close.
- No contradictory dual-close setup that causes duplicate close attempts.

---

# Source-Aligned Example

Canonical post-submit close-dialog example in this template family:

```
process close-dialog (
    name: Close Dialog
    type: closeDialog
    execution {
        sequence: 30
    }
    serverSideCondition {
        type: requestIsContainedInValue
        value: CREATE,SAVE,DELETE
    }
)
```
