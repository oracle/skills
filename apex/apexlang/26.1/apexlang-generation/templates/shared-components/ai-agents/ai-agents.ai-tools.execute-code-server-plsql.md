---
templateId: ai-agents.ai-tools.execute-code-server-plsql.md
componentType: aiAgents
version: 1.0
description: AI Tool used to execute PL/SQL code
imports:
  - ai-agents.at-tools.parameters.md
---

# Purpose

Standard AI Agent contract for action-oriented tools that execute PL/SQL.

This tool is intended for server-side updates or validations that should run on demand.

---

# Generation Rules (MANDATORY)

1. Replace the `{{parameters}}` section with a list of concrete parameters from `ai-agents.at-tools.parameters.md`.
2. Keep PL/SQL concise and deterministic.
3. Use named notation for packaged procedure or function calls.
4. If the PL/SQL block would exceed 4000 characters, or if it performs multi-step DML, orchestration, or non-trivial business validation, move the logic into a packaged procedure or function owned by the application schema.
5. Expected validation or business-rule outcomes may follow the application's chosen runtime pattern:
   - surface a clear user-facing validation or business-rule message from a packaged procedure, or
   - return a handled user-facing success/error message from a packaged function.
6. When the tool needs to surface a success, error, info, or warning response, use `apex_ai.set_tool_result(...)` in `settings.plsqlCode` to populate:
   - `p_result` for the business result name or validation name
   - `p_notification_message` for the user-facing message
   - `p_notification_type` using one of `success`, `error`, `info`, or `warning`
7. When logic is moved into a package, keep `settings.plsqlCode` as a thin wrapper that calls that package using named notation only and maps the package outcome into `apex_ai.set_tool_result(...)`.
8. If the required packaged database object does not yet exist, add it through the application's supporting objects or stop with Missing Inputs when that is out of scope.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| name | yes | string | Static ID of the AI tool; lower case, no spaces, use `-`. |
| tool.name | yes | string | Friendly execution name; lower case, no spaces, use `_`. |
| description.description | no | string | Description of the tool; recommended because this acts as the prompt for the tool
| notification.message | no | string | Optional notification displayed once the tool has completed |
| notification.type | no | string | Notification type: `info`, `generic`, or `success` |
| settings.plsqlCode | yes | plsql | PL/SQL block executed by the tool. Prefer a thin wrapper when heavy logic lives in a package and use `apex_ai.set_tool_result(...)` to return the business result plus the user-facing notification. |

---

# Conditional Rendering Rules

- Only render `notification {}` if there is a value.
- For heavy action logic, render only a short wrapper block in `settings.plsqlCode` and keep the full implementation in a packaged procedure/function.
- All other sections should always be rendered.

---

# Guardrail Notes

- Treat packaged procedures/functions as the default destination for large or business-critical action logic.
- Inline PL/SQL is appropriate only for small, local, deterministic actions.
- When a package call is used, pass inputs with named notation and keep the AI tool block easy to review.
- If the application uses packaged procedures for action tools, surface clear business-validation messages from those procedures instead of forcing a separate message-return function.
- If the application uses packaged functions for action tools, map the returned values into `apex_ai.set_tool_result(...)` and do not assume a generic PL/SQL `return <expr>` pattern is valid.
- Reserve low-signal raw database errors for truly unexpected failures; expected business validations should surface as clear user-facing messages.

---

# Output Template — AI Tool
```
    tool {{name}} (
        name: {{tool.name}}
        type: executeServersideCode
        executionPoint: onDemand
        description:
            ```
            {{description}}
            ```
        {{notificationBlock}}
        settings {
            language: plsql
            plsqlCode:
                ```plsql
                {{settings.plsqlCode}}
                ```
        }

        {{parameters}}

    )
```

---
