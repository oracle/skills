---
contractId: acl-roles.common
componentType: acl-roles
version: 1.0
---

# Generation Rules (MANDATORY)

1. Output only valid apexlang DSL.
2. Do not output markdown.
3. Do not explain the output.
4. Emit only the `role` block with `name` for ACL role declarations.

# Required

- roleStaticId
  type: string
  required: true
  format: lowercase kebab-case (`[a-z0-9]+(?:-[a-z0-9]+)*`)

- name
  type: string
  required: true

# Output Contract (strict)

```apexlang
role {{roleStaticId}} (
    name: {{name}}
)
```
