---
templateId: processes.view-document
componentType: process
version: 1.0
imports:
  - processes._common
description: Stream or download files using declarative process attributes.
---

# Purpose

Provide a declarative pattern for rendering or downloading files stored in application tables.

---

# Output Template – Full
```
process {{processStaticId}} (
    name: {{name}}
    type: download
    fileHandling {
        viewFileAs: {{fileHandling.viewFileAs}}
        multipleFiles: {{fileHandling.multipleFiles}}
        filename: {{fileHandling.filename}}
    }
    source {
        sqlQuery:
            ```sql
            {{source.sqlQuery}}
            ```
    }
    execution {
        sequence: {{execution.sequence}}
        point: beforeHeader
    }
    serverSideCondition {
        type: {{serverSideCondition.type}}
        item: {{serverSideCondition.item}}
        {{serverSideCondition.comparisonAttribute}}: {{serverSideCondition.comparisonValue}}
    }
)
```

---

# Conditional Rendering Rules

- Remove `viewFileAs` when `multipleFiles: true`; supply a ZIP filename.
- Ensure SQL aliases match expected columns (`file_content`, `file_name`, `mime_type`).
- Apply `serverSideCondition` for authorization or item gating as required.
- Set `comparisonAttribute` to `list` for item colon-list membership types; otherwise use `value`.
