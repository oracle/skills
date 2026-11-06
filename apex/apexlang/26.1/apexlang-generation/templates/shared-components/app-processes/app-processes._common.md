---
templateId: app-processes.common
componentType: appProcess
version: 1.0
imports:
  - app-processes.before-header.md
  - app-processes.after-header.md
  - app-processes.before-regions.md
  - app-processes.after-regions.md
  - app-processes.after-footer.md
  - app-processes.after-submit.md
  - app-processes.processing.md
  - app-processes.after-authentication.md
  - app-processes.ajax-callback.md
  - app-processes.new-session.md
description: Canonical contract and guardrails for application processes.
---

# Purpose

Standardize application process generation with an executeCode-only contract, deterministic execution points, and server-side condition rules.

---

# Generation Rules (MANDATORY)

1. Emit APEXlang DSL only; no markdown commentary inside output.
2. Always declare `execution.point` using supported enum values: `beforeHeader`, `afterHeader`, `beforeRegions`, `afterRegions`, `afterFooter`, `afterSubmit`, `processing`, `afterAuthentication`, `ajaxCallback`, `newSession`.
3. `appProcess` MUST use `type: executeCode` only.
4. `appProcess` MUST NOT use the `invokeApi` process type.
5. If packaged logic is required, call packages in `source.plsqlCode` using named notation.
6. Server-side conditions must use types catalogued in `references/policies/memory-bank/20-data/apex.logic.md`; include only the attributes required for the chosen type.
7. Honor build options and authorization schemes; omit blocks entirely when variables are null.
8. Place new processes in `applications/<app>/shared-components/app-processes.apx`.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| staticId | yes | string | Lowercase, hyphenated identifier (e.g., `process-on-load`). |
| name | yes | string | Builder label describing purpose. |
| type | yes | literal | `executeCode` only for appProcess. |
| source.plsqlCode | yes | plsql | Required for appProcess; must follow named-notation guardrail. |
| execution.sequence | yes | number | Execution order; default to 10 if unspecified. |
| execution.point | yes | enum | See Rule 2. |
| error.errorMessage | optional | string | Provide friendly message; omit block if null. |
| error.displayLocation | optional | enum | `inlineInNotification`, `onErrorPage`. |
| serverSideCondition.type | optional | enum | `rowsReturned`, `noRowsReturned`, `expression`, `functionBody`, `always`, `never`. |
| serverSideCondition.sqlQuery | conditional | sql | Required when type is `rowsReturned`/`noRowsReturned`. |
| serverSideCondition.plsqlExpression | conditional | plsql | Required when type is `expression`. |
| serverSideCondition.plsqlFunctionBody | conditional | plsql | Required when type is `functionBody`. |
| security.authorizationScheme | optional | string | Reference shared authorization aliases (`@administration-rights`, etc.). |
| config.buildOption | optional | string | Build option reference (`@commented-out`, `!@commented-out`). |
| comments.comments | optional | string | Descriptive notes for maintainers. |

---

# Conditional Rendering Rules

- Always render `type: executeCode` for appProcess.
- Always render `source { plsqlCode: ```plsql ... ``` }` for appProcess.
- Do not render `invoke {}` in appProcess templates.
- Include `serverSideCondition {}` only when `serverSideCondition.type` is supplied.
- Add `security { authorizationScheme: @alias }` only when authorization is set.
- Add `config { buildOption: <value> }` only when build option differs from default.
- Include `comments {}` when descriptive text exists; omit otherwise.

---

# Output Template — Full
```
appProcess {{staticId}} (
    name: {{name}}
    type: executeCode
    source {
        plsqlCode:
            ```plsql
            {{source.plsqlCode}}
            ```
    }
    execution {
        sequence: {{execution.sequence}}
        point: {{execution.point}}
    }
    error {
        errorMessage: {{error.errorMessage}}
        displayLocation: {{error.displayLocation}}
    }
    serverSideCondition {
        type: {{serverSideCondition.type}}
        sqlQuery:
            ```sql
            {{serverSideCondition.sqlQuery}}
            ```
        plsqlExpression: {{serverSideCondition.plsqlExpression}}
        plsqlFunctionBody:
            ```plsql
            {{serverSideCondition.plsqlFunctionBody}}
            ```
    }
    security {
        authorizationScheme: {{security.authorizationScheme}}
    }
    config {
        buildOption: {{config.buildOption}}
    }
    comments {
        comments: {{comments.comments}}
    }
)
```

---

# Guardrails Reminder

- Follow Named Notation for all PL/SQL calls (see `references/policies/memory-bank/00-guard/ai.guard.md`).
- Do not invent execution points; use documented enums only.
- Keep app-process logic concise and deterministic.
- Ensure server-side condition SQL never references session state without bind variable notation (`:Pxx_ITEM`).
