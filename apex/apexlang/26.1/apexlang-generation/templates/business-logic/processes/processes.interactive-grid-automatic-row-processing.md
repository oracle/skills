---
templateId: processes.interactive-grid-automatic-row-processing
componentType: process
version: 1.0
imports:
  - processes._common
description: Automatic row processing for Interactive Grid regions.
---

# Purpose

Persist insert, update, and delete operations made in an editable Interactive Grid.

---

# Output Template – Full
```
process {{processStaticId}} (
    name: {{name}}
    type: interactiveGridAutoRowProcessing
    editableRegion: @{{editableRegion}}
    execution {
        sequence: {{execution.sequence}}
    }
    successMessage {
        successMessage: {{successMessage.successMessage}}
    }
    error {
        errorMessage: {{error.errorMessage}}
    }
    serverSideCondition {
        whenButtonPressed: @{{serverSideCondition.button}}
    }
)
```

---

# Conditional Rendering Rules

- Set `editableRegion` to the IG region static ID.
- Include `serverSideCondition` when processing is tied to a specific button (e.g., Save).
- Ensure grid toolbar provides a Save action when using automatic processing.
