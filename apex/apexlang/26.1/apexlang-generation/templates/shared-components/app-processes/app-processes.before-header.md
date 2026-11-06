---
templateId: app-processes.before-header
componentType: appProcess
version: 1.0
imports:
  - app-processes._common.md
description: Application process that executes before the page header is rendered.
---

# Purpose

Run lightweight initialization logic (for example, enforcing global redirects or setting session state) before any page header content renders.

---

# Generation Rules (MANDATORY)

1. Use `execution.point: beforeHeader`.
2. `appProcess` must use `type: executeCode`.
3. Keep package calls in `source.plsqlCode` with named notation.

---

# Recommended Use Cases

- Guard access prior to rendering navigation (authorization, maintenance mode checks).
- Prime application-level items or context required by every page.
- Redirect users to onboarding or forced password change flows.

---

# Output Template — Execute Code Example
```
appProcess {{staticId}} (
    name: {{name}}
    type: executeCode
    source {
        plsqlCode:
            ```plsql
            app_process_api.on_before_header(
                p_app_user => :APP_USER
            );
            ```
    }
    execution {
        sequence: {{execution.sequence}}
        point: beforeHeader
    }
    serverSideCondition {
        type: {{serverSideCondition.type}}
    }
    security {
        authorizationScheme: {{security.authorizationScheme}}
    }
    config {
        buildOption: {{config.buildOption}}
    }
)
```

---

# Guardrails

- Ensure server-side condition SQL uses bind variables (e.g., `:APP_USER`).
- Omit `serverSideCondition {}` when always executing.
- Keep PL/SQL deterministic and named-notation compliant.
