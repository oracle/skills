---
templateId: region.form.basic
componentType: region
version: 1.0
imports:
  - form._common.md
  - form._items._common.md
  - form._processes._common.md
description: Table-backed form scenario using variable-driven item and process placeholders.
---

# Purpose

Form scenario for local database sources with reusable item and process placeholders.

---

# Generation Rules (MANDATORY)

1. Load `form._common.md`, `form._items._common.md`, and `form._processes._common.md` before use.
2. Keep item, button, and process definitions variable-driven; do not inline demo literals.
3. Pair with `business-logic/processes/form-initialization` and `form-automatic-row-processing` when automatic DML is enabled.

---

# Variable Contract

## Required Variables

- `regionStaticId`
- `name`
- `source.location`
- `layout.sequence`
- `layout.slot`
- `appearance.template`
- `formItems` (from `form._items._common.md`)

## Optional Variables

- `source.tableName`
- `source.type`
- `source.sqlQuery`
- `source.plsqlFunctionBody`
- `appearance.templateOptions`
- `edit.*`
- `serverSideCondition.*`
- `security.*`
- `formButtons`
- `formProcesses` (from `form._processes._common.md`)

---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: form
  source {
    location: {{source.location}}
    tableName: {{source.tableName}}
    sqlQuery:
      ```sql
      {{source.sqlQuery}}
      ```
    plsqlFunctionBody:
      ```plsql
      {{source.plsqlFunctionBody}}
      ```
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: {{appearance.template}}
    templateOptions: {{appearance.templateOptions}}
  }
  edit {
    enabled: {{edit.enabled}}
  }
  serverSideCondition {
    type: {{serverSideCondition.type}}
    item: {{serverSideCondition.item}}
    {{serverSideCondition.comparisonAttribute}}: {{serverSideCondition.comparisonValue}}
  }
  security {
    authorizationScheme: @{{security.authorizationScheme}}
  }
)

{{formItems}}

{{formButtons}}

{{formProcesses}}
```

---

# Conditional Rendering Rules

- Render `{{formItems}}` using `form._items._common.md`.
- Render `{{formProcesses}}` using `form._processes._common.md`.
- Omit optional blocks that are not required for the selected source type.
- For the standard table-backed path, emit `source.tableName` only and omit `source.type`.
