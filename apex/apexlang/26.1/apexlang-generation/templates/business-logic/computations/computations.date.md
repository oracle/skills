---
templateId: computations.date
componentType: computation
version: 1.0
imports:
  - computations._common
description: Date computation archetype.
---

# Purpose

Use when computing date values (e.g., today, next business day) via expressions or function bodies.

---

# Output Template – Minimal
```
computation {{computationStaticId}} (
    name: {{computationName}}
    location: item
    computationPoint: beforeHeader
    type: expression
    item: {{item}}
    plsqlExpression: trunc(sysdate)
)
```

---

# Conditional Rendering Rules

- Adjust `computationPoint` when the date must refresh after submit or during processing.
- Use `functionBody` when calculations require procedural logic.
- Include `executionSequence` when sequencing relative to other computations.
