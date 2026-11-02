---
templateId: computations.time
componentType: computation
version: 1.0
imports:
  - computations._common
description: Time/timestamp computation archetype.
---

# Purpose

Use for computations deriving time or timestamp values (combining date/time fields, generating timestamps).

---

# Output Template – Minimal
```
computation {{computationStaticId}} (
    name: {{computationName}}
    location: pageProcess
    computationPoint: beforeHeader
    type: functionBody
    item: {{item}}
    plsqlFunctionBody:
        ```plsql
        {{plsqlFunctionBody}}
        ```
)
```

---

# Conditional Rendering Rules

- Adjust `location` and `computationPoint` to align with when the timestamp should be computed.
- Ensure the function body returns a string or date compatible with the target item data type.
