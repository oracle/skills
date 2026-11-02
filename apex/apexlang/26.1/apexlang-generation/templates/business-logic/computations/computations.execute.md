---
templateId: computations.execute
componentType: computation
version: 1.0
imports:
  - computations._common
description: Invoke packaged computation via `type: invokeApi`.
---

# Purpose

Use when a computation calls a packaged API (`invokeApi`) for derived values.

---

# Output Template – Full
```
computation {{computationStaticId}} (
    name: {{computationName}}
    location: {{location}}
    computationPoint: {{computationPoint}}
    type: invokeApi
    item: {{item}}
    invoke {
        package: {{invoke.package}}
        procedureOrFunction: {{invoke.procedureOrFunction}}
    }
    parameter {{parameter.name}} (
        direction: {{parameter.direction}}
        value {
            item: {{parameter.value.item}}
        }
    )
)
```

---

# Conditional Rendering Rules

- Provide one `parameter` block per argument, using named notation.
- Align `invoke.package` with consolidated package naming (e.g., `app_process_api`).
- Remove `item` when the API returns an application-level value.
