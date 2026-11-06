---
templateId: actions.inline-button
componentType: templateComponent
imports:
  - actions.common
version: 1.0
description: Inline Actions helper example with sibling buttons.
---

# Purpose
Render a compact inline action cluster with one or more sibling buttons.

# Output Template
```apx
actions {
    size: {{size}}
    gap: {{gap}}

    button {{buttonStaticId}} (
        label: {{button.label}}
    )
}
```

# Conditional Rendering Rules
- Use sibling `button` blocks when the action count is small and all actions deserve equal emphasis.
- Omit nested groups and menu triggers in this scenario.

# Validation Checklist
- The fragment contains at least one `button`.
- `size` and `gap` use supported values.
