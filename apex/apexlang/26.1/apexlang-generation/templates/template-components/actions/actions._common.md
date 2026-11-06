---
templateId: actions.common
componentType: templateComponent
version: 1.0
description: Shared canonical contract for the Actions helper template component.
---

# Purpose

Define the shared variable contract, guardrails, and output skeleton for Theme 42 `actions` helper fragments.

---

# Generation Rules (MANDATORY)

1. Use `actions { ... }` as an inline helper fragment, not a standalone region.
2. Keep this helper scoped to action clusters rather than single page-level buttons.
3. Use only supported child blocks: `button`, `menu`, or nested `actions`.
4. Render `wrapActions` only when the prompt explicitly calls for wrapping.
5. Keep `gap` and `size` within the documented enums from `actions._template_options.md`.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| size | optional | enum | `tiny`, `small`, `medium`, `large`, `extraLarge`. |
| gap | optional | enum | `none`, `small`, `medium`, `large`. |
| wrapActions | optional | boolean | Wrap actions when the container is narrow. |
| child button | optional | block | Inline button helper entry. |
| child menu | optional | block | Inline menu-trigger helper entry. |
| child actions | optional | block | Nested action group when a secondary cluster is needed. |

---

# Output Template - Full

```apx
actions {
    size: {{size}}
    gap: {{gap}}
    wrapActions: {{wrapActions}}

    button {{buttonStaticId}} (
        label: {{button.label}}
        behavior {
            target: {{button.behavior.target}}
        }
    )
}
```

---

# Conditional Rendering Rules

- Omit `wrapActions` unless the prompt explicitly calls for wrapping behavior.
- Use nested `actions` only when the parent pattern needs multiple grouped clusters.
- Prefer a `menu` child instead of many sibling buttons when the action count is high.

# Validation Checklist

- The fragment starts with `actions {`.
- Child blocks are limited to `button`, `menu`, or nested `actions`.
- `gap` and `size` stay within the documented enums.
