---
templateId: authorizations.plsql.boolean
componentType: authorizations
version: 1.0
imports:
  - authorizations.common
---

# Purpose

Generate an Oracle APEX authorization component of type `plSqlFunctionBody`.

This template must be used only when authorization logic is implemented as a PL/SQL function body that returns BOOLEAN.

---

# Generation Rules (MANDATORY)

1. `settings.plsqlFunctionBody` MUST contain a RETURN statement returning TRUE or FALSE.
2. The PL/SQL block may optionally include BEGIN/END, but must be syntactically valid.

---

# Variable Contract

## Required Variables

- settings.plsqlFunctionBody
  - Type: plsql
  - Constraints:
    - Must return BOOLEAN.
    - Must include RETURN TRUE or RETURN FALSE.
    - Must not include trailing slash (/).

---

# Conditional Rendering Rules

- If `serverCache.evaluationPoint` is not provided, omit the entire `serverCache {}` block.
- If `error.errorMessage` is not provided, omit the entire `error {}` block.
- If `comments.comments` is not provided, omit the entire `comments {}` block.

---

# Output Template
```
authorization {{name}} (
    name: {{displayName}}
    authorizationScheme {
        type: plSqlFunctionBody
    }
    settings {
        plsqlFunctionBody:
            ```plsql
            {{settings.plsqlFunctionBody}}
            ```
    }
    serverCache {
        evaluationPoint: {{serverCache.evaluationPoint}}
    }
    error {
        errorMessage: {{error.errorMessage}}
    }
    comments {
        comments: {{comments.comments}}
    }
)
```
---
