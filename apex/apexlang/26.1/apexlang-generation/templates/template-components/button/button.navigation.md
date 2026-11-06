---
templateId: button.navigation
componentType: templateComponent
imports:
  - button.common
version: 1.0
description: Standard navigation Button helper example.
---

# Purpose
Render a Button helper that navigates to another target.

# Output Template
```apx
button {{buttonStaticId}} (
    label: {{label}}
    behavior {
        target: {{behavior.target}}
    }
)
```

# Conditional Rendering Rules
- Render `behavior` for navigation.
- Omit hot, icon-only, and menu-trigger settings in the basic navigation case.

# Validation Checklist
- The helper includes a valid target.
- The helper uses a stable static id.
