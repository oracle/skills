---
templateId: computations.static-value
componentType: computation
version: 1.0
imports:
  - computations._common
description: Static value computation archetype.
---

# Purpose

Use when assigning literal values to page or application items (`type: staticValue`). Use this scenario together with `computations._common.md` as the canonical static-assignment pattern.

---

# Required Inputs

- `item`: Target page/application item.
- `computationPoint`: Execution timing (defaults to `beforeHeader`).
- `staticValue`: Literal value or substitution string to assign.

Optional inputs:
- `executionSequence`: Numeric ordering relative to other computations.
- `comments`: Documentation block for future maintainers.
- `error`: Custom error message.

---

# Output Template – Minimal
```
computation {{computationStaticId}} (
    name: {{computationName}}
    location: item
    computationPoint: {{computationPoint}}
    type: staticValue
    item: {{item}}
    computation {
        staticValue: {{staticValue}}
    }
)
```

---

# Output Template – Full
```
computation {{computationStaticId}} (
    name: {{computationName}}
    location: {{location}}
    computationPoint: {{computationPoint}}
    type: staticValue
    item: {{item}}
    execution {
        sequence: {{execution.sequence}}
        point: {{execution.point}}
    }
    computation {
        staticValue: {{staticValue}}
    }
    error {
        errorMessage: {{error.errorMessage}}
    }
    comments {
        comments: {{comments.comments}}
    }
)
```

---

# Conditional Rendering Rules

- Default `location` to `item`; switch to `pageProcess` only when setting application scope and an explicit item is not needed.
- `staticValue` accepts numbers, strings, and substitution expressions (no SQL/PLSQL allowed here).
- Omit `execution` block when relying on default sequence/point.
- For application computations, adapt the same value-assignment contract to the application-computation output shape owned by this template family.
