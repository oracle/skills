---
templateId: processes.form-automatic-row-processing
componentType: process
version: 1.0
imports:
  - processes._common
description: Automatic DML process for Form regions.
---

# Purpose

Perform automatic insert, update, and delete operations for a Form region.

---

# Output Template – Minimal
```
process {{processStaticId}} (
    name: {{name}}
    type: formAutoRowProcessing
    formRegion: @{{formRegion}}
    execution {
        sequence: {{execution.sequence}}
    }
)
```

---

# Output Template – Full
```
process {{processStaticId}} (
    name: {{name}}
    type: formAutoRowProcessing
    formRegion: @{{formRegion}}
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

- Ensure the Form region’s source attributes map columns to items correctly.
- Align `successMessage`/`error` with UX requirements; remove if using defaults.
- Emit only one `formAutoRowProcessing` for a given `formRegion`.
- Do not duplicate ARP processes by button or request to vary success messaging; when different success text is needed, populate a transient page item before submit and reference that item from the single ARP `successMessage`.
- Pair with `processes.form-initialization.md` for query/capture symmetry.
