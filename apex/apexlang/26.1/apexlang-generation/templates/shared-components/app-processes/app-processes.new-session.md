---
templateId: app-processes.new-session
componentType: appProcess
version: 1.0
imports:
  - app-processes._common.md
description: Application process that runs once per new APEX session.
---

# Purpose

Initialize session-scoped values whenever a new APEX session starts.

---

# Generation Rules (MANDATORY)

1. Use `execution.point: newSession`.
2. `appProcess` must use `type: executeCode`.
3. Ensure logic is idempotent; the process may fire after session resets or timeout.

---

# Recommended Use Cases

- Seed application-level preference values.
- Establish logging context or correlation IDs.
- Sync session time zone or locale settings.

---

# Output Template — Execute Code Example
```
appProcess {{staticId}} (
    name: {{name}}
    type: executeCode
    source {
        plsqlCode:
            ```plsql
            app_process_api.init_session(
                p_app_user => :APP_USER
            );
            ```
    }
    execution {
        sequence: {{execution.sequence}}
        point: newSession
    }
    serverSideCondition {
        type: {{serverSideCondition.type}}
    }
    comments {
        comments: {{comments.comments}}
    }
)
```

---

# Guardrails

- Do not rely on authentication status; new sessions may start before login.
- Keep execution lightweight to avoid slowing initial page loads.
- Omit optional blocks when variables are absent.
