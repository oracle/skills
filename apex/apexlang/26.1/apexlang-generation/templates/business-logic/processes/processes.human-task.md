---
templateId: processes.human-task
componentType: process
version: 1.0
imports:
  - processes._common
description: Create a human task instance linked to Shared Component task definitions.
---

# Purpose

Create approval or manual action tasks using predefined task definitions.

---

# Output Template – Full
```
process {{processStaticId}} (
    name: {{name}}
    type: humanTaskCreate
    humanTask {
        definition: @{{humanTask.definition}}
        detailsPkItem: {{humanTask.detailsPkItem}}
    }
    execution {
        sequence: {{execution.sequence}}
    }
    parameter {{parameter.name}} (
        value {
            type: item
            item: {{parameter.value.item}}
        }
    )
)
```

---

# Conditional Rendering Rules

- Provide one `parameter` block per task definition parameter.
- Ensure the task definition exists in Shared Components.
- Use `serverSideCondition` to prevent duplicate task creation when needed.
