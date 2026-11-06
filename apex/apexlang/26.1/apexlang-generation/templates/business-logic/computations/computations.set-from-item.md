---
templateId: computations.set-from-item
componentType: computation
version: 1.0
imports:
  - computations._common
description: Item-to-item assignment computation archetype.
---

# Purpose

Use when copying the value from one item to another using `type: item`. Use this scenario together with `computations._common.md` as the canonical item-to-item assignment pattern.

---

# Required Inputs

- `item`: Target page/application item receiving the value.
- `sourceItem`: Source item to copy from.
- `computationPoint`: Execution timing (defaults to `beforeHeader`).

Optional inputs:
- `executionSequence`: Numeric ordering when multiple computations exist.
- `comments`: Inline documentation.
- `error`: Custom error message on failure.

---

# Output Template – Minimal
```
computation {{computationStaticId}} (
    name: {{computationName}}
    location: item
    computationPoint: {{computationPoint}}
    type: item
    item: {{item}}
    computation {
        itemName: {{sourceItem}}
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
    type: item
    item: {{item}}
    execution {
        sequence: {{execution.sequence}}
        point: {{execution.point}}
    }
    computation {
        itemName: {{sourceItem}}
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

- Ensure `sourceItem` exists and is submitted when required (e.g., after submit computations pulling from page items).
- Default `location` to `item`; switch to `pageProcess` only for application-level copies.
- Use execution sequencing to define precedence when mixing with static value computations targeting the same item.
- Avoid circular references (copying an item from itself or creating dependency loops within the same computation point).
