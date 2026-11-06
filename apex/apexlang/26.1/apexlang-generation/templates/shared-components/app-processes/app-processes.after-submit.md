---
templateId: app-processes.after-submit
componentType: appProcess
version: 1.0
imports:
  - app-processes._common.md
description: Application process that runs after page submission but before computations and validations.
---

# Purpose

Execute immediate logic triggered by page submission prior to computation/validation phases.

---

# Generation Rules (MANDATORY)

1. Use `execution.point: afterSubmit`.
2. `appProcess` must use `type: executeCode`.
3. Keep package calls in named-notation PL/SQL and handle exceptions with friendly messages.

---

# Recommended Use Cases

- Branch or reroute users based on submitted values.
- Run centralized hooks before validation or computation phases.
- Initialize session state used during validation or computation steps.

---

# Output Template — Execute Code Example
```
appProcess {{staticId}} (
    name: {{name}}
    type: executeCode
    source {
        plsqlCode:
            ```plsql
            app_process_api.on_after_submit(
                p_request => :REQUEST
            );
            ```
    }
    execution {
        sequence: {{execution.sequence}}
        point: afterSubmit
    }
    error {
        errorMessage: {{error.errorMessage}}
        displayLocation: {{error.displayLocation}}
    }
    serverSideCondition {
        type: {{serverSideCondition.type}}
    }
)
```

---

# Guardrails

- Ensure prerequisite items are submitted; otherwise, explicitly set them before execution.
- Omit optional blocks when variables are not provided.
- Keep business logic consolidated in shared packages for reuse.
