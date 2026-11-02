---
templateId: content-row.report-appearance-variants
componentType: templateComponent
imports:
  - content-row.common
version: 1.0
description: Report-mode Content Row appearance variants.
---

# Purpose
Show compact and layout-oriented appearance options such as borders, padding, stack-on-mobile, and theme colors.

# Output Template
```apx
region {{regionStaticId}} (
    type: themeTemplateComponent/contentRow
    componentAppearance { display: report }
    plugin-appearance {
        style: compact
        hideBorders: true
        removePadding: true
        stackOnMobile: true
    }
)
```

# Conditional Rendering Rules
- Apply appearance variants only when readability and layout constraints require them.
- Keep default appearance when no explicit styling intent is provided.

# Validation Checklist
- Appearance settings are supported plugin attributes.
- Combined options do not conflict with readability goals.
