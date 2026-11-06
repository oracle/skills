---
templateId: app-processes.ajax-callback
componentType: appProcess
version: 1.0
imports:
  - app-processes._common.md
description: Application process exposed as an AJAX callback for dynamic actions or client-side code.
---

# Purpose

Provide lightweight server-side endpoints invoked via `apex.server.process` or dynamic actions.

---

# Generation Rules (MANDATORY)

1. Use `execution.point: ajaxCallback`.
2. Require authentication or authorization unless explicitly public; avoid exposing sensitive operations.
3. Return JSON via `apex_json` or set page items; ensure content-type headers are set appropriately.

---

# Recommended Use Cases

- Fetch additional data without full page submit.
- Trigger server-side validations or calculations from client events.
- Record telemetry or user actions asynchronously.

---

# Output Template — Execute Code Example
```
appProcess {{staticId}} (
    name: {{name}}
    type: executeCode
    source {
        plsqlCode:
            ```plsql
            app_process_api.ajax_dispatch(
                p_process => '{{staticId}}',
                p_user    => :APP_USER
            );
            ```
    }
    execution {
        sequence: {{execution.sequence}}
        point: ajaxCallback
    }
    security {
        authorizationScheme: {{security.authorizationScheme}}
    }
)
```

---

# Guardrails

- Enforce `authorizationScheme` unless the callback is intentionally public.
- Keep responses short to minimize latency (< 1 MB payloads).
- Sanitize client inputs; validate using packaged utilities before executing DML.

