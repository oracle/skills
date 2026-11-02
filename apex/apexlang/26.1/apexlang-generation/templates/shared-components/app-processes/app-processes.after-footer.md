---
templateId: app-processes.after-footer
componentType: appProcess
version: 1.0
imports:
  - app-processes._common.md
description: Application process that executes after the page footer renders.
---

# Purpose

Handle post-render tasks such as asynchronous logging, clean-up, or notification dispatch once the full page has rendered.

---

# Generation Rules (MANDATORY)

1. Use `execution.point: afterFooter`.
2. `appProcess` must use `type: executeCode`.
3. Defer expensive work to background jobs or scheduled processes when possible.

---

# Recommended Use Cases

- Queue analytics or telemetry updates that should occur after rendering.
- Finalize temporary resources (e.g., purge collections created earlier).
- Trigger external webhooks announcing completed page load.

---

# Output Template — Execute Code Example
```
appProcess {{staticId}} (
    name: {{name}}
    type: executeCode
    source {
        plsqlCode:
            ```plsql
            app_process_api.finalize_page_render(
                p_page_id => :APP_PAGE_ID
            );
            ```
    }
    execution {
        sequence: {{execution.sequence}}
        point: afterFooter
    }
    error {
        errorMessage: {{error.errorMessage}}
    }
)
```

---

# Guardrails

- Keep logic non-blocking; if failures occur, log via centralized error handler.
- Remove optional blocks when values are not provided.
- Respect build options to toggle diagnostics in non-production environments.
