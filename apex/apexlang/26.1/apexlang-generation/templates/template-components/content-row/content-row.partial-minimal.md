---
templateId: content-row.partial-minimal
componentType: templateComponent
imports:
  - content-row.common
version: 1.0
description: Smallest valid Content Row partial-mode example.
---

# Purpose
Render a single-row Content Row region in `partial` mode with core `settings` only.

# Output Template
```apx
region {{regionStaticId}} (
    name: {{name}}
    type: themeTemplateComponent/contentRow
    componentAppearance {
        display: partial
    }
    settings {
        title: &{{settings.titleColumn}}.
    }
)
```

# Conditional Rendering Rules
- Keep `componentAppearance.display: partial`.
- Omit report-only sections (pagination, grouping, row selection, entity title, explicit report columns).

# Validation Checklist
- One-row source query or deterministic single-entity source.
- `settings.title` is present and uses `&COLUMN_NAME.` syntax when backed by a source column.
