---
templateId: processes.execute-code
componentType: process
version: 1.0
imports:
  - processes._common
description: Execute PL/SQL code block within a page process.
---

# Purpose

Run lightweight, inline PL/SQL when no declarative or packaged alternative exists.

---

# Output Template – Full
```
process {{processStaticId}} (
    name: {{name}}
    type: executeCode
    source {
        plsqlCode:
            ```plsql
            {{source.plsqlCode}}
            ```
    }
    execution {
        sequence: {{execution.sequence}}
        point: {{execution.point}}
    }
    serverSideCondition {
        whenButtonPressed: @{{serverSideCondition.button}}
    }
)
```

---

# Conditional Rendering Rules

- Keep PL/SQL idempotent; avoid commits or heavy logic.
- Remove `button`/`serverSideCondition` when running unconditionally.
- Prefer `invokeApi` when calling packaged procedures.
- If inline PL/SQL exceeds 4000 raw characters, treat this template as temporary and prefer package extraction (`app_process_api` default) plus `type: invokeApi` for page processes.
