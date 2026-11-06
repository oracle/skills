---
templateId: authentications.apex
componentType: authentications
version: 1.0
imports:
  - authentications.common
---

# Purpose

This template is an authentication scheme for built-in APEX users

---

# Generation Rules (MANDATORY)

None

---

# Variable Contract

## Required Variables

None

---

# Conditional Rendering Rules

None

---

# Output Template
```
authentication {{name}} (
    name: {{displayName}}
    settings {
        type: oracleApexAccounts
    }
)
```
---
