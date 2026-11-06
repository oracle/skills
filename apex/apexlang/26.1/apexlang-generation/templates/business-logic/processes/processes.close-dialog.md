---
templateId: processes.close-dialog
componentType: process
version: 1.0
imports:
  - processes._common
description: Close modal dialog or drawer pages after server-side processing.
---

# Purpose

Close a modal dialog or drawer after server-side work completes.

---

# Generation Rules (MANDATORY)

1. Use `type: closeDialog` only for post-submit success closure on modal or drawer pages.
2. On modal and drawer pages, `closeDialog` must be sequenced after every other after-submit side effect process.
3. If the page also performs notification, email, logging, audit, or packaged follow-up work, those processes must use lower execution sequence numbers than `closeDialog`.
4. Do not preserve inherited example sequence values once additional after-submit processes are introduced; resequence `closeDialog` so it is unambiguously last.

---

# Output Template – Minimal
```
process {{processStaticId}} (
    name: {{name}}
    type: closeDialog
    execution {
        sequence: {{execution.sequence}}
    }
    serverSideCondition {
        whenButtonPressed: {{serverSideCondition.button}}
        type: {{serverSideCondition.type}}
        {{serverSideCondition.comparisonAttribute}}: {{serverSideCondition.comparisonValue}}
    }
)
```

---

# Conditional Rendering Rules

- Adjust `serverSideCondition.comparisonValue` to match button requests that should close the dialog.
- Remove the condition when the dialog should close on every submit.
- Use `comparisonAttribute: list` for item colon-list membership types; otherwise use `value`.
- On modal and drawer pages, set `execution.sequence` higher than every other submit-time process on the page.
