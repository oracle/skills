---
templateId: processes.invoke-api
componentType: process
version: 1.0
imports:
  - processes._common
description: Invoke packaged PL/SQL APIs via `type: invokeApi`.
---

# Purpose

Call consolidated PL/SQL package routines from a page process while honoring the invokeApi-default guardrail and its thin-wrapper exception.

This template is for compiler-proven `invokeApi` process shapes only. For page-process function return mapping, use the validated output shape below instead of inventing alternative `value.type`, top-level `direction`, or top-level `dataType` forms.

---

# Output Template – Full

```
process {{processStaticId}} (
    name: {{name}}
    type: invokeApi
    execution {
        sequence: {{execution.sequence}}
        point: {{execution.point}}
    }
    invoke {
        package: {{invoke.package}}
        procedureOrFunction: {{invoke.procedureOrFunction}}
    }
    parameter {{parameter.name}} (
        parameter {
            direction: {{parameter.parameter.direction}}
            dataType: {{parameter.parameter.dataType}}
            ignoreOutput: {{parameter.parameter.ignoreOutput}}
        }
        value {
            item: {{parameter.value.item}}
        }
        advanced {
            displaySequence: {{parameter.advanced.displaySequence}}
        }
    )
    successMessage {
        successMessage: {{successMessage.successMessage}}
    }
)
```

---

# Conditional Rendering Rules

- Provide one `parameter` block per argument using named notation.
- Align package naming with consolidation guardrails (`app_process_api`).
- Remove `button` when the process is not tied to a submit button.
- For page-process function return mapping, keep `direction`, `dataType`, and `ignoreOutput` inside the nested `parameter { ... }` block.
- For page-process function return mapping, bind the target session-state item using `value { item: ... }` with no sibling `value.type`.
- Use boolean literals for `ignoreOutput`; the validated output shape for function returns is `ignoreOutput: false`.
- Keep `advanced.displaySequence` on every `invokeApi` process parameter; local compiler metadata marks it as required.
- Do not move `direction`, `dataType`, or `ignoreOutput` to the top level of the `parameter (...)` block.
- Do not add `value.type` for the validated page-process function-return shape unless a newer compiler-backed source explicitly requires a different form.
