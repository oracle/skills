---
templateId: button.menu-trigger
componentType: templateComponent
imports:
  - button.common
version: 1.0
description: Menu-trigger Button helper example.
---

# Purpose
Render a Button helper that opens a menu instead of navigating directly.

# Output Template
```apx
button {{buttonStaticId}} (
    label: {{label}}
    menuId: {{menuId}}
)
```

# Conditional Rendering Rules
- Use `menuId` only when the parent component expects a menu trigger.
- Omit navigation behavior when the menu is the primary interaction.

# Validation Checklist
- `menuId` is present.
- The helper does not mix incompatible navigation and menu-trigger behavior.
