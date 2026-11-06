---
templateId: app-processes.before-regions
componentType: appProcess
version: 1.0
imports:
  - app-processes._common.md
description: Application process that executes before body regions render.
---

# Purpose

Prepare data or session state required by regions while allowing header content to remain responsive.

---

# Generation Rules (MANDATORY)

1. Use `execution.point: beforeRegions`.
2. `appProcess` must use `type: executeCode`.
3. Keep instrumentation and package calls in named-notation PL/SQL.

---

# Recommended Use Cases

- Prefetch user profile data used across multiple regions.
- Compute derived session values for conditional region rendering.
- Seed collections or temporary tables prior to report rendering.

---

# Output Template — Execute Code Example
```
appProcess {{staticId}} (
    name: {{name}}
    type: executeCode
    source {
        plsqlCode:
            ```plsql
            app_process_api.preload_page_context(
                p_page_id => :APP_PAGE_ID
            );
            ```
    }
    execution {
        sequence: {{execution.sequence}}
        point: beforeRegions
    }
    serverSideCondition {
        type: {{serverSideCondition.type}}
    }
    security {
        authorizationScheme: {{security.authorizationScheme}}
    }
)
```

---

# Guardrails

- Maintain short execution time; if heavy operations are required, move to background jobs.
- Only modify session state items that exist prior to region rendering.
- Remove optional blocks when variables are not provided.
