---
templateId: actions.nested-group
componentType: templateComponent
imports:
  - actions.common
version: 1.0
description: Actions helper example with nested action groups.
---

# Purpose
Render a parent action cluster that contains a secondary nested action group.

# Output Template
```apx
actions {
    button {{primaryButtonId}} (
        label: {{primaryButton.label}}
    )

    actions {
        size: {{nested.size}}
        button {{secondaryButtonId}} (
            label: {{secondaryButton.label}}
        )
    }
}
```

# Conditional Rendering Rules
- Use nested `actions` only when the parent component truly needs grouped secondary actions.
- Keep nesting shallow; do not create deeply recursive action trees.

# Validation Checklist
- The nested structure remains one level deep.
- Parent and child groups both use supported helper blocks.
