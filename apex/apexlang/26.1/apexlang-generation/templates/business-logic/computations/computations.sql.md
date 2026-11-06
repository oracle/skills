---
templateId: computations.sql
componentType: computation
version: 1.0
imports:
  - computations._common
description: Single-value SQL computation template.
---

# Purpose

Use for scalar SQL queries that set item or application state.

Compiler-backed enum note:
- For page and app computations that return one value, emit `type: sqlQuerySingleValue`.
- Do not emit `type: sqlQuery`; that token is not valid for computation entries in the compiler-backed computation component contract.

---

# Output Template – Minimal
```
computation {{computationStaticId}} (
    name: {{computationName}}
    location: {{location}}
    computationPoint: {{computationPoint}}
    type: sqlQuerySingleValue
    item: {{item}}
    sqlQuery:
        ```sql
        {{sqlQuery}}
        ```
)
```

---

# Output Template – Full
```
computation {{computationStaticId}} (
    name: {{computationName}}
    location: {{location}}
    computationPoint: {{computationPoint}}
    type: sqlQuerySingleValue
    item: {{item}}
    sqlQuery:
        ```sql
        {{sqlQuery}}
        ```
    executionSequence: {{executionSequence}}
    serverSideCondition {
        type: {{serverSideCondition.type}}
        item: {{serverSideCondition.item}}
        {{serverSideCondition.comparisonAttribute}}: {{serverSideCondition.comparisonValue}}
    }
)
```

---

# Conditional Rendering Rules

- Use `type: sqlQuerySingleValue` for scalar SQL computations and `type: sqlQueryMultipleValues` only when the computation returns multiple values.
- Ensure SQL returns a single row; include ORDER BY for deterministic results.
- Submit required page items via `pageItemsToSubmit` in the calling context.
- Remove `serverSideCondition` when not gating by request/item.
- Set `comparisonAttribute` to `list` for item colon-list membership types; otherwise use `value`.
