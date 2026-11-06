---
templateId: validations.expression
componentType: validation
version: 1.0
imports:
  - validations._common
description: Expression validation template.
---

# Purpose

Use for PL/SQL or SQL expression validations (`type: expression`).

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
        type: expression
        plsqlExpression:
            ```plsql
            {{validation.plsqlExpression}}
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

# Output Template – Full
```
validation {{validationStaticId}} (
    name: {{validationName}}
    execution {
        sequence: {{execution.sequence}}
    }
    validation {
        editableRegion: @{{validation.editableRegion}}
        type: expression
        language: {{validation.language}}
        plsqlExpression:
            ```plsql
            {{validation.plsqlExpression}}
            ```
        sqlExpression:
            ```sql
            {{validation.sqlExpression}}
            ```
    }
    error {
        errorMessage: {{error.errorMessage}}
        associatedItem: @{{error.associatedItem}}
        associatedColumn: {{error.associatedColumn}}
    }
    serverSideCondition {
        whenButtonPressed: @{{serverSideCondition.whenButtonPressed}}
    }
)
```

---

# Output Template – SQL Expression (Implicit Expression Type)
```
validation {{validationStaticId}} (
    name: {{validationName}}
    execution {
        sequence: {{execution.sequence}}
    }
    validation {
        editableRegion: @{{validation.editableRegion}}
        language: sql
        sqlExpression:
            ```sql
            {{validation.sqlExpression}}
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

- Set `language: sql` and `sqlExpression` when using SQL expressions.
- Use the implicit expression form when you need only `language: sql` + `sqlExpression`.
- Render `editableRegion` only when the expression validation targets an interactive grid.
- Use `associatedColumn` for interactive grid expression validations and `associatedItem` for page-item validations.
- Remove `serverSideCondition` when the validation runs unconditionally.
- Keep expressions side-effect free; raise errors through PL/SQL only when necessary.
