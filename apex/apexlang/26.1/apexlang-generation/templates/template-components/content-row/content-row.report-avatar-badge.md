---
templateId: content-row.report-avatar-badge
componentType: templateComponent
imports:
  - content-row.common
version: 1.0
description: Report-mode Content Row avatar and badge permutations.
---

# Purpose
Show grouped avatar and badge attributes in report mode.

# Output Template
```apx
region {{regionStaticId}} (
    type: themeTemplateComponent/contentRow
    componentAppearance { display: report }
    settings {
        displayAvatar: true
        displayBadge: true
    }
    plugin-avatar {
        type: {{pluginAvatar.type}}
        initials: {{pluginAvatar.initials}}
        description: {{pluginAvatar.description}}
        shape: {{pluginAvatar.shape}}
        size: {{pluginAvatar.size}}
        cssClasses: {{pluginAvatar.cssClasses}}
    }
    plugin-badge {
        label: {{pluginBadge.label}}
        value: {{pluginBadge.value}}
        state: {{pluginBadge.state}}
        displayLabel: {{pluginBadge.displayLabel}}
        style: {{pluginBadge.style}}
        shape: {{pluginBadge.shape}}
        size: {{pluginBadge.size}}
        icon: {{pluginBadge.icon}}
        position: {{pluginBadge.position}}
        columnWidth: {{pluginBadge.columnWidth}}
    }
)
```

# Conditional Rendering Rules
- Keep display toggles aligned with the rendered features: use `settings.displayAvatar` for avatar visibility, `settings.displayBadge` for badge visibility, and use `plugin-avatar` only for avatar configuration when avatar content is supplied.
- Use `initials` only when `type` is `initials`.
- Use `cssClasses` only when the prompt explicitly requests avatar styling.
- Use badge state/style only when semantically meaningful.
- Use `style` and `shape` only when the prompt explicitly asks for a visual badge treatment such as `subtle` or `rounded`.
- Use `icon` only when the prompt explicitly requests an icon-bearing badge.
- Use `position` only when the prompt explicitly requests a start/end badge placement override.

# Validation Checklist
- Avatar and badge source values exist.
- Badge icon and badge position values remain deterministic when supplied.
- Mappings remain deterministic across rows.
