---
templateId: computations.function-body
componentType: computation
version: 1.0
imports:
  - computations._common
description: PL/SQL function body computation template.
---

# Purpose

Use for PL/SQL function body computations that return a scalar value.

---

# Output Template – Minimal
```
computation {{computationStaticId}} (
    name: {{computationName}}
    location: {{location}}
    computationPoint: {{computationPoint}}
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

- Keep function bodies side-effect free; use packages for complex logic.
- Remove `item` when targeting application level state.
- Add `executionSequence` when ordering relative to other computations matters.
