---
templateId: computations.expression
componentType: computation
version: 1.0
imports:
  - computations._common
description: PL/SQL expression computation template.
---

# Purpose

Use when deriving values via PL/SQL expressions (`type: expression`).

---

# Output Template – Minimal
```
computation {{computationStaticId}} (
    name: {{computationName}}
    location: item
    computationPoint: beforeHeader
    type: expression
    item: {{item}}
    plsqlExpression: {{plsqlExpression}}
)
```

---

# Output Template – Full
```
computation {{computationStaticId}} (
    name: {{computationName}}
    location: {{location}}
    computationPoint: {{computationPoint}}
    type: expression
    item: {{item}}
    language: {{language}}
    plsqlExpression: {{plsqlExpression}}
    executionSequence: {{executionSequence}}
    serverSideCondition {
        whenButtonPressed: @{{serverSideCondition.whenButtonPressed}}
    }
)
```

---

# Conditional Rendering Rules

- Set `language: sql` when using SQL expressions instead of PL/SQL.
- Omit `item` for page-level computations (`location: pageProcess`).
- Remove `serverSideCondition` when unconditional.
- Keep expressions side-effect free; rely on packages for complex logic.
