---
templateId: region.form.common
componentType: region
version: 1.0
description: Shared contract for form regions.
---

# Purpose

Standardize the variable contract, guardrails, and template skeleton for form region scenarios. Document the native `form` region shell emitted by the current generator.

---

# Generation Rules (MANDATORY)

1. Load `references/policies/memory-bank/30-pages/apex.form.md` and related logic/SQL rules before drafting form regions.
2. Use the dedicated `region-form` template.
3. Keep edit operations explicit in the `edit` block.
4. Map items to table columns or REST attributes consistently; keep form region sources aligned with processes.
5. Pair form regions with initialization and automatic row processing templates as needed.
6. Treat companion dialog buttons as a separate generated support region.
7. Default form regions to `appearance.template: @/standard`; keep `@/buttons-container` only for the companion buttons region.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Identifier used after the `region` keyword (e.g., `FORM_REGION`). |
| name | yes | string | Builder display name. |
| type | yes | enum | Always `form`. |
| source.location | yes | enum | `localDatabase`, `restSource`, etc. |
| source.type | conditional | enum | Use only for typed non-table source modes such as `sqlQuery`, `functionBody`, or `propertyGraph`. Omit it for the standard table-backed path. |
| source.sqlQuery | conditional | sql | Required for `source.type: sqlQuery`. |
| source.plsqlFunctionBody | conditional | plsql | Required for `source.type: functionBody`; the body must return SQL text. |
| source.tableName | conditional | string | Required for the standard table-backed local-database path; omit `source.type` when `tableName` is used. |
| source.restSource | conditional | string | REST Data Source alias when using `restSource`. |
| layout.sequence | yes | number | Region order in the page slot. |
| layout.slot | yes | enum | Slot the region occupies (e.g., `BODY`). |
| appearance.template | yes | string | Region template reference; default to `@/standard`. |
| appearance.templateOptions | optional | array | Additional modifiers (`#DEFAULT#` default); use the documented accepted values in `form._template_options.md`, keep `#DEFAULT#` standalone, and do not substitute emitted CSS class strings. |
| edit.enabled | optional | boolean | Enables automatic DML for the form region; when emitted, use `true`. |
| serverSideCondition.* | optional | condition | Visibility gating. |
| security.authorizationScheme | optional | string | Authorization scheme alias. |

---

# Output Template – Full

```
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
    restSource: @{{source.restSource}}
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
```

---

# Conditional Rendering Rules

- Remove optional blocks (`edit`, `serverSideCondition`, `security`) when not required.
- Include `restSource` only when `location: restSource` is used.
- For table-backed local-database forms, emit `source.tableName` only and omit `source.type`.
- For typed local-database forms, emit exactly one typed mode such as `source.type: sqlQuery` + `source.sqlQuery` or `source.type: functionBody` + `source.plsqlFunctionBody`.
- Ensure table/column definitions align with the form's source and associated processes.
- Pair form regions with `form-initialization` and `form-automatic-row-processing` when using table or REST DML.
- For item colon-list membership conditions, render `comparisonAttribute` as `list`; keep `value` for other comparison types.
- Keep dialog buttons outside the form region itself.
- For form regions, emit only `edit.enabled`; do not emit `edit.add`, `edit.update`, `edit.delete`, or `edit.allowedOperations`.

---

# Guardrails

- Keep form region SQL lightweight; prefer views or packaged APIs for complex logic.
- Validate REST sources support required operations before enabling automatic DML.
- Ensure session state protection is configured via item templates and processes.
- Treat `edit.add`, `edit.update`, and `edit.delete` as interactive-grid borrowing errors when the region type is `form`.
- Metadata export lookup: search for `Form`, `NATIVE_FORM`, and form edit-operation properties.
