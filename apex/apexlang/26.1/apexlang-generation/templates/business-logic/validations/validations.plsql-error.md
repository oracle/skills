---
templateId: validations.plsql-error
componentType: validation
version: 1.0
imports:
  - validations._common
description: PL/SQL raising error validation template.
---

# Purpose

Use when implementing `type: plsqlError` validations that must raise custom errors.

---

# Output Template – Minimal
```
validation {{validationStaticId}} (
    name: {{validationName}}
    execution {
        sequence: {{execution.sequence}}
    }
    validation {
        editableRegion: @{{validation.editableRegion}}
        type: plsqlError
        plsqlCodeRaisingError:
            ```plsql
            {{validation.plsqlCodeRaisingError}}
            ```
    }
)
```

---

# Conditional Rendering Rules

- Raise errors via `raise_application_error` with documented error codes.
- Render `editableRegion` only when the validation targets an interactive grid.
- Add `associatedColumn` in an `error {}` block for interactive grid validations when the error should be pinned to a specific column; otherwise use `associatedItem` for page-item validations.
- Prevent DML or side effects; validation should only validate state.
- Add `error` block if custom messages are required beyond raised error text.
