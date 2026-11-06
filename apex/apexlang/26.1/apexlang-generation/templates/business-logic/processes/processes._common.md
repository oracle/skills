---
templateId: processes.common
componentType: process
version: 1.0
description: Shared contract for Oracle APEX page process templates.
---

# Purpose

Document the shared attributes, guardrails, and skeleton used by all page process templates. Load this file before referencing any scenario-specific template.

---

# Generation Rules (MANDATORY)

1. Load `references/policies/memory-bank/20-data/apex.logic.md` before drafting processes.
2. Populate required variables from this contract; scenario files may only specialize optional sections.
3. Prefer `type: invokeApi` for packaged logic and follow named-notation policy.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| processStaticId | yes | string | Identifier (`PROC_<context>`). |
| name | yes | string | Builder display name. |
| type | yes | enum | Process type (e.g., `formAutoRowProcessing`, `sendEMail`, `invokeApi`). |
| execution.sequence | yes | number | Execution order within the process point. |
| execution.point | conditional | enum | `beforeHeader`, `afterSubmit`, etc.; omit for defaults. |
| button.button | conditional | string | Button alias when tied to submit buttons. |
| formRegion | conditional | string | Form region static ID (form processes). |
| editableRegion | conditional | string | Interactive grid region static ID (IG processes). |
| invoke.package/function | conditional | string | Package routine for `invokeApi`. |
| parameter.* | conditional | object | `invokeApi` parameters with `direction` and value mapping. |
| successMessage.successMessage | optional | string | Success message. |
| error.errorMessage | optional | string | Error message. |
| serverSideCondition.* | optional | condition | Button/item/request gating. |
| security.authorizationScheme | optional | string | Authorization scheme alias. |
| advanced.executionMappingIdentifier | optional | string | Builder metadata identifier. |
| type-specific blocks | conditional | variant | Scenario-specific sections (`emailHeader`, `fileHandling`, etc.). |

---

# Output Template – Full
```
process {{processStaticId}} (
    name: {{name}}
    type: {{type}}
    execution {
        sequence: {{execution.sequence}}
        point: {{execution.point}}
    }

    serverSideCondition {
        type: {{serverSideCondition.type}}
        item: {{serverSideCondition.item}}
        {{serverSideCondition.comparisonAttribute}}: {{serverSideCondition.comparisonValue}}
        whenButtonPressed: @{{serverSideCondition.button}}
    }
    successMessage {
        successMessage: {{successMessage.successMessage}}
    }
    error {
        errorMessage: {{error.errorMessage}}
    }
    security {
        authorizationScheme: @{{security.authorizationScheme}}
    }
    /* type-specific content */
)
```

Execution-chain example:
```apexlang
process {{parentChainStaticId}} (
    name: {{parentChainName}}
    type: executionChain
    execution { sequence: {{parentChain.sequence}} point: {{parentChain.point}} }
    serverSideCondition { type: itemIsNotNull item: {{parentChain.item}} }
)
process {{firstChildProcessStaticId}} (
    name: {{firstChildProcessName}}
    type: {{firstChildProcessType}}
    executionChain: @{{parentChainStaticId}}
    execution { sequence: {{firstChildProcess.sequence}} }
)
/* repeat child process blocks with executionChain: @{{parentChainStaticId}} as needed */
```

---

# Conditional Rendering Rules

- Remove optional blocks (button, serverSideCondition, security) when not required.
- Include `execution.point` only when deviating from defaults.
- Preserve triple backticks around SQL/PL/SQL content.
- Ensure references (`formRegion`, `editableRegion`) match existing components.
- Use `comparisonAttribute: list` for `itemIsInColonDelimitedList` / `itemIsNotInColonDelimitedList`; use `comparisonAttribute: value` for the remaining comparison types.
- When using {{paraemeter}}, set {{parameter.advanced.displaySequence}} to sequential values, counting by 10
- If the process is gated by a button, then add the ``whenButtonPressed`` section and reference the corresponding button

---

# Guardrails

- Prefer declarative `invokeApi` for packaged logic; avoid `executeCode` for packaged calls.
- Validate SQL/PLSQL per `references/policies/memory-bank/20-data/apex.sql.md` or note validation pending.
- Respect named-notation and consolidation guardrails in `references/policies/memory-bank/00-guard/ai.guard.md`.
