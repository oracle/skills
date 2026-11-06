---
templateId: region.media-list.partial
componentType: region
version: 1.0
imports:
  - media-list._common.md
description: Single-item Media List partial using existing session-state values.
---

# Purpose

Render one Media List item without report-only source, grouping, layout, or column metadata.

# Output Template

```apexlang
region {{regionStaticId}} (
    name: {{name}}
    type: themeTemplateComponent/mediaList
    layout {
        {{parentRegionProperty}}
        sequence: {{layout.sequence}}
        slot: {{layout.slot}}
    }
    appearance {
        template: @/standard
        templateOptions: #DEFAULT#
    }
    componentAppearance {
        display: partial
    }
    settings {
        title: {{titleSessionStateValue}}
        {{descriptionProperty}}
    }
    {{securityBlock}}
)
```

# Conditional Rendering Rules

- Bind title and optional description only to literal values or existing session-state values selected by the owning partial-mode contract.
- Omit `source`, `orderBy`, report columns, `plugin-grouping`, `applyThemeColors`, `layout`, and `size` settings.
- Avatar, Badge, and link behavior may be added only through their shared conditional blocks when their values and authorization are resolved.

# Validation Checklist

- Display mode is exactly `partial`.
- No report-only block or setting is present.
- The title is nonempty and its session-state source exists when dynamic.
