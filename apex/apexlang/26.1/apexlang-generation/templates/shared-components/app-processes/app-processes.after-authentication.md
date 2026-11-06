---
templateId: app-processes.after-authentication
componentType: appProcess
version: 1.0
imports:
  - app-processes._common.md
description: Application process that runs immediately after authentication completes.
---

# Purpose

Execute logic once a user successfully authenticates but before navigation proceeds.

---

# Generation Rules (MANDATORY)

1. Use `execution.point: afterAuthentication`.
2. `appProcess` must use `type: executeCode`.
3. Keep logic idempotent; authentication can run multiple times per session.

---

# Recommended Use Cases

- Persist user preferences or consent acknowledgments.
- Route administrators to oversight dashboards.
- Log authentication metadata to audit tables.

---

# Output Template — Execute Code Example
```
appProcess {{staticId}} (
    name: {{name}}
    type: executeCode
    source {
        plsqlCode:
            ```plsql
            app_process_api.after_authentication_hook(
                p_app_user => :APP_USER
            );
            ```
    }
    execution {
        sequence: {{execution.sequence}}
        point: afterAuthentication
    }
    serverSideCondition {
        type: {{serverSideCondition.type}}
    }
)
```

---

# Guardrails

- Avoid referencing page items; rely on session and authentication context.
- Handle failures gracefully; prefer logging over blocking login without user messaging.
- Remove optional blocks when variables are not supplied.
