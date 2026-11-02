---
contractId: authorizations.common
componentType: authorizations
version: 1.0
---

# Generation Rules (MANDATORY)

1. Output only valid apexlang DSL.
2. Do not output markdown.
3. Do not explain the output.
4. Omit optional blocks entirely if their variables are not provided.

# Required

- name
  type: string
  required: true

- displayName
  type: string
  required: true

# Optional

- serverCache.evaluationPoint
  type: enum
  values:
    - perSession
    - perPageView
    - perComponent
    - always

- error.errorMessage
  type: string

- comments.comments
  type: string

# Conditional Rendering Rules

- Omit serverCache block if serverCache.evaluationPoint not provided
- Omit error block if error.errorMessage not provided
- Omit comments block if comments.comments not provided