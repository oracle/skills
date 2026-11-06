---
templateId: validations.function-body
componentType: validation
version: 1.0
imports:
  - validations._common
description: PL/SQL function body validation template.
---

# Purpose

Use for PL/SQL function body validations that return `NULL` or raise errors.

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
        type: functionBody
        plsqlFunctionBody:
            ```plsql
            {{validation.plsqlFunctionBody}}
            ```
    }
    error {
        errorMessage: {{error.errorMessage}}
        associatedItem: @{{error.associatedItem}}
        associatedColumn: {{error.associatedColumn}}
    }
)
```

---

# Output Template – Boolean Return
```
validation {{validationStaticId}} (
    name: {{validationName}}
    execution {
        sequence: {{execution.sequence}}
    }
    validation {
        editableRegion: @{{validation.editableRegion}}
        type: functionBodyReturningBoolean
        plsqlFunctionBody:
            ```plsql
            {{validation.plsqlFunctionBodyReturningBoolean}}
            ```
    }
    error {
        errorMessage: {{error.errorMessage}}
        associatedItem: @{{error.associatedItem}}
        associatedColumn: {{error.associatedColumn}}
    }
)
```

---

# Conditional Rendering Rules

- Ensure the function returns `NULL` on success; raise custom errors via PL/SQL when needed.
- Do not choose function-body validation if item, expression, or SQL validation can express the rule.
- Do not leave user-correctable submit prompts in a page process just because PL/SQL can raise them there; move those checks into validations first.
- Use `type: functionBodyReturningBoolean` when the PL/SQL function returns only `TRUE`/`FALSE`.
- Render `editableRegion` only when the validation targets an interactive grid.
- Use `associatedColumn` for interactive grid function-body validations and `associatedItem` for page-item validations.
- Remove optional blocks when not required (e.g., `serverSideCondition`).
- Keep logic side-effect free; use packages for heavy business rules.
