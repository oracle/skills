---
templateId: region.form.dialog-buttons
componentType: region
version: 1.0
imports:
  - form._common.md
description: Companion dialog-buttons region generated with dialog forms.
---

# Purpose

Document the generated static-content button container used with dialog forms.

# Generation Rules (MANDATORY)

1. Load `form._common.md` first.
2. Use this companion region only for dialog-form scenarios.
3. Keep icon-placement defaults on the generated button declarations; the `@/buttons-container` region itself does not carry `t-Button--iconLeft` or `t-Button--iconRight`.

# Variable Contract

## Required Variables

- `layout.slot`
- `appearance.template`

# Output Template – Full

```apexlang
region buttons (
  name: Buttons
  type: staticContent
  layout {
    slot: dialogFooter
  }
  appearance {
    template: @/buttons-container
  }
)
```

# Conditional Rendering Rules

- Keep this as a support region, not a replacement for the primary form region.
- Apply icon-position template options only on icon-plus-text buttons associated with this region.
