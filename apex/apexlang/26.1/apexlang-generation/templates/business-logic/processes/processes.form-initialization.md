---
templateId: processes.form-initialization
componentType: process
version: 1.0
imports:
  - processes._common
description: Form initialization process bound to a Form region.
---

# Purpose

Initialize a Form region by fetching the row identified by primary-key items before the page header renders.

---

# Output Template – Minimal
```
process {{processStaticId}} (
    name: {{name}}
    type: formInitialization
    formRegion: @{{formRegion}}
    execution {
        sequence: {{execution.sequence}}
        point: beforeHeader
    }
)
```

---

# Output Template – Full
```
process {{processStaticId}} (
    name: {{name}}
    type: formInitialization
    formRegion: @{{formRegion}}
    execution {
        sequence: {{execution.sequence}}
        point: beforeHeader
    }
    serverSideCondition {
        type: {{serverSideCondition.type}}
        item: {{serverSideCondition.item}}
    }
)
```

---

# Conditional Rendering Rules

- Remove `serverSideCondition` when initialization should run unconditionally.
- Ensure primary-key item session state is set before this process executes.
- Pair with `processes.form-automatic-row-processing.md` for full CRUD flows.
