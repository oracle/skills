---
templateId: validations.sql
componentType: validation
version: 1.0
imports:
  - validations._common
description: SQL query validation template.
---

# Purpose

Use for SQL validations that check row existence (`noRowsReturned`, `rowsReturned`).

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
        type: rowsReturned
        sqlQuery:
            ```sql
            {{validation.sqlQuery}}
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
        type: {{validation.type}}
        sqlQuery:
            ```sql
            {{validation.sqlQuery}}
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

# Conditional Rendering Rules

- Choose `type: rowsReturned` or `noRowsReturned` based on requirement.
- Render `editableRegion` only when the SQL validation targets an interactive grid.
- Use `associatedColumn` for interactive grid SQL validations and `associatedItem` for page-item validations.
- Submit dependent items and bind variables before validation executes.
- Remove `serverSideCondition` when not button-gated.
