---
templateId: acl-roles.standard
componentType: acl-roles
version: 1.0
imports:
  - acl-roles._common.md
---

# Purpose

Generate one compiler-recognized ACL role declaration in `acl-roles.apx`.

# Variable Contract

## Required Variables

- roleStaticId
  - Lowercase kebab-case role identifier.

- name
  - User-facing ACL role name.

# Output Template

```apexlang
role {{roleStaticId}} (
    name: {{name}}
)
```
