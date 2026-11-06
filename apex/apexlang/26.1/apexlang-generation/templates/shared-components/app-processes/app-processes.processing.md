---
templateId: app-processes.processing
componentType: appProcess
version: 1.0
imports:
  - app-processes._common.md
description: Application process that executes during the processing phase after computations and validations.
---

# Purpose

Run transactional logic that depends on successful validations before branches execute.

---

# Generation Rules (MANDATORY)

1. Use `execution.point: processing`.
2. Encapsulate business logic in packaged APIs to respect named-notation and consolidation guardrails.
3. Handle exceptions with user-friendly messages; avoid raising raw ORA errors.

---

# Recommended Use Cases

- Commit verified changes to core tables.
- Invoke external services once validation succeeds.
- Prepare response payloads for post-submit branches.

---

# Output Template — Execute Code Example
```
appProcess {{staticId}} (
    name: {{name}}
    type: executeCode
    source {
        plsqlCode:
            ```plsql
            app_process_api.submit_transaction(
                p_page_id => :APP_PAGE_ID,
                p_request => :REQUEST
            );
            ```
    }
    execution {
        sequence: {{execution.sequence}}
        point: processing
    }
    error {
        errorMessage: {{error.errorMessage}}
        displayLocation: {{error.displayLocation}}
    }
)
```

---

# Guardrails

- Wrap DML in packages; include commit/rollback strategy consistent with app standards.
- Use `error.displayLocation: onErrorPage` when blocking navigation.
- Remove optional blocks when values are not supplied.

