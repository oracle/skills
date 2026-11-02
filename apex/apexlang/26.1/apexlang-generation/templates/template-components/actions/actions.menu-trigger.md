---
templateId: actions.menu-trigger
componentType: templateComponent
imports:
  - actions.common
version: 1.0
description: Actions helper example with a menu trigger.
---

# Purpose
Render an action cluster that combines a primary button with a menu-trigger helper for secondary actions.

# Output Template
```apx
actions {
    button {{primaryButtonId}} (
        label: {{primaryButton.label}}
    )

    button {{menuTriggerId}} (
        label: {{menuTrigger.label}}
        menuId: {{menuTrigger.menuId}}
    )
}
```

# Conditional Rendering Rules
- Use a menu trigger when the action set is larger than the visible inline space.
- Keep only one trigger button per action cluster unless the parent pattern explicitly needs more.

# Validation Checklist
- The menu-trigger button includes `menuId`.
- The cluster still contains a clear primary action when required.
