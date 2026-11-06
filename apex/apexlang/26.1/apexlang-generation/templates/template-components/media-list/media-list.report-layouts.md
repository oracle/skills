---
templateId: region.media-list.report-layouts
componentType: region
version: 1.0
imports:
  - media-list._common.md
description: Native Media List report layout, size, and theme-color choices.
---

# Purpose

Apply curated Universal Theme presentation choices without custom CSS.

# Output Template

```apexlang
settings {
    title: {{titleColumn}}
    {{descriptionProperty}}
    {{layoutProperty}}
    {{sizeProperty}}
    {{applyThemeColorsProperty}}
}
```

# Responsive Selection Matrix

| Intent/container | Setting |
|------------------|---------|
| Narrow region or unspecified width | Omit `layout` for the native single-column flow. |
| Normal body width with compact items | `layout: 2ColumnGrid` or `3ColumnGrid`. |
| Verified wide body/dashboard lane | `layout: 4ColumnGrid` or `5ColumnGrid`. |
| Explicit one-row, non-wrapping presentation in a wide container | `layout: horizontalSpan`. |
| Explicitly larger item treatment | `size: large`. |
| Native Avatar/Badge row colors | Omit `applyThemeColors` because its default is `true`. |
| Explicit neutral row colors | `applyThemeColors: false`. |

# Conditional Rendering Rules

- Layout, size, and theme colors are report-only.
- Emit exactly one layout token from the accepted inventory; never pass the underlying CSS return value.
- Do not combine multiple grid layouts or add custom breakpoint classes.
- Treat `horizontalSpan` as deliberate wide-layout intent because it keeps items in one horizontal row.
- Use Universal Theme defaults for wrapping, spacing, and focus behavior.

# Validation Checklist

- Every emitted value exists in `media-list._template_options.md`.
- The selected layout matches the verified owning container width.
- No custom structural CSS is introduced.
