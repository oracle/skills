---
templateId: authorizations.exists.query
componentType: authorizations
version: 1.0
imports:
  - authorizations.common
---

# Purpose

This template should be used when a user requests access to a resource, and the authorization check is based on the existence of records returned by a SQL query. The SQL query should be designed to return at least one record if the user has the necessary permissions to access the resource. If the query returns no records, it indicates that the user does not have the required permissions, and an error message will be displayed.

---

# Generation Rules (MANDATORY)

1. `settings.sqlQuery` MUST contain a valid SQL statement.

---

# Variable Contract

## Required Variables

- authorizationScheme.type:
    - existsSqlQuery - SQL query will bring back at lease one row
    - notExistsSqlQuery - SQL query will not bring back any rows

- settings.sqlQuery:
    - The SQL query that will be executed to determine if the user has access.  It need only return or not return a row; columns do not matter.

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
        type: {{authorizationScheme.type}}
    }
    settings {
        sqlQuery:
            ```sql
            {{settings.sqlQuery}}
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