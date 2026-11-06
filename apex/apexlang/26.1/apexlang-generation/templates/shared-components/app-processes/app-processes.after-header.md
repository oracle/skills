---
templateId: app-processes.after-header
componentType: appProcess
version: 1.0
imports:
  - app-processes._common.md
description: Application process that fires immediately after the page header renders and before body regions load.
---

# Purpose

Perform lightweight logic that depends on header initialization (for example, session messages, breadcrumbs) but must execute before regions render.

---

# Generation Rules (MANDATORY)

1. Use `execution.point: afterHeader`.
2. If using `executeCode`, ensure PL/SQL is idempotent and leverages named notation.
3. Do not modify items rendered within body regions—limit to global context or session settings.

---

# Recommended Use Cases

- Broadcast global alerts or notifications before regions load.
- Set context items used by dynamic actions or shared components.
- Trigger logging or analytics hooks after header setup completes.

---

# Output Template — Execute Code Example
```
appProcess {{staticId}} (
    name: {{name}}
    type: executeCode
    source {
        plsqlCode:
            ```plsql
            app_process_api.log_page_entry(
                p_page_id => :APP_PAGE_ID,
                p_user    => :APP_USER
            );
            ```
    }
    execution {
        sequence: {{execution.sequence}}
        point: afterHeader
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

- Keep PL/SQL logic concise (< 50 lines); refactor into `app_process_api` when growing.
- Avoid DML unless wrapped in packaged APIs with error handling.
- Remove `serverSideCondition {}` when unused.

