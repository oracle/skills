---
templateId: authorizations.role
componentType: authorizations
version: 1.0
imports:
  - authorizations.common
---

# Purpose

This template should be used when a user requests access to a resource, and the authorization check is based on the user being a member or not being a member of a specific role or group.

---

# Generation Rules (MANDATORY)

None

---

# Variable Contract

## Required Variables

- authorizationScheme.type:
    - isInRoleOrGroup - User is in a specific role or group
    - isNotInRoleOrGroup - User is not in a specific role or group

- settings.type:
    - custom - Custom role or group defined in the application
    - workspaceGroup - Role or group defined at the workspace level
    - `no value` - Role defined in the application roles [default]

- settings.names:
    - The display name(s) of the role(s) or group(s) to check for membership.
    - Emit as a bracketed multi-line list under `names: [` with one role display name per line.
    - Each role display-name line must be indented twelve spaces inside the `names` block.
    - Do not emit ACL role static IDs in this field.
    - Do not emit comma-separated inline names.

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
        type: {{settings.type}}
        names: [
{{settings.names}}
        ]
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
