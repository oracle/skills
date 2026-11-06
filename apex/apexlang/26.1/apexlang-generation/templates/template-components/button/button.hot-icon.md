---
templateId: button.hot-icon
componentType: templateComponent
imports:
  - button.common
version: 1.0
description: Hot Button helper example with icon styling.
---

# Purpose
Render a Button helper with hot emphasis and a leading icon.

# Output Template
```apx
button {{buttonStaticId}} (
    label: {{label}}
    cssClasses: t-Button--iconLeft
    iconClasses: {{iconClasses}}
    isHot: true
)
```

# Conditional Rendering Rules
- Use `isHot: true` only when the button deserves primary emphasis.
- Render `iconClasses` only when visible icon treatment is requested.
- Use `cssClasses: t-Button--iconLeft` by default for icon-plus-text helpers; replace with `t-Button--iconRight` only when right-side icon placement is explicitly requested.
- Do not render a left/right icon-position class when the helper is icon-only.

# Validation Checklist
- The icon classes are present.
- The helper includes exactly one icon-position class for icon-plus-text output.
- Hot styling is used intentionally for primary emphasis.
