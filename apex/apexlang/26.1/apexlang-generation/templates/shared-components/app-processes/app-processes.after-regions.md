---
templateId: app-processes.after-regions
componentType: appProcess
version: 1.0
imports:
  - app-processes._common.md
description: Application process that fires after all body regions render but before the footer.
---

# Purpose

Run wrap-up tasks that depend on region data (for example, aggregating results, staging notifications) prior to footer rendering.

---

# Generation Rules (MANDATORY)

1. Use `execution.point: afterRegions`.
2. Avoid heavy DML; prefer enqueueing jobs or calling packaged APIs for asynchronous work.
3. Only reference session state items populated by regions earlier in the rendering cycle.

---

# Recommended Use Cases

- Queue background processes once regions finish presenting data.
- Evaluate region-computed flags before displaying footer messages.
- Persist analytics events capturing region interaction context.

---

# Output Template — Execute Code Example
```
appProcess {{staticId}} (
    name: {{name}}
    type: executeCode
    source {
        plsqlCode:
            ```plsql
            app_process_api.enqueue_refresh(
                p_page_id => :APP_PAGE_ID,
                p_user    => :APP_USER
            );
            ```
    }
    execution {
        sequence: {{execution.sequence}}
        point: afterRegions
    }
    serverSideCondition {
        type: {{serverSideCondition.type}}
    }
    config {
        buildOption: {{config.buildOption}}
    }
)
```

---

# Guardrails

- Ensure PL/SQL calls use named notation.
- Remove optional blocks when variables are not supplied.
- If asynchronous behavior is required, document completion handling for downstream regions.

