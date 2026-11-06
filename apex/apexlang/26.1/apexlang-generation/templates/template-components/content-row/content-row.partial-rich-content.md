---
templateId: content-row.partial-rich-content
componentType: templateComponent
imports:
  - content-row.common
version: 1.0
description: Partial-mode example with avatar, badge, and inline link positions.
---

# Purpose
Render a single-row Content Row with avatar and badge enabled and link positions for title/avatar/badge.

# Output Template
```apx
region {{regionStaticId}} (
    type: themeTemplateComponent/contentRow
    componentAppearance { display: partial }
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
    action {{titleActionId}} ( position: titleLink )
    action {{avatarActionId}} ( position: avatarLink )
    action {{badgeActionId}} ( position: badgeLink )
)
```

# Conditional Rendering Rules
- Keep `display: partial`.
- Use `settings.displayAvatar` to enable avatar rendering and keep `plugin-avatar` for avatar configuration only.
- Use `initials` only when `type` is `initials`.
- Use `cssClasses` only when the prompt explicitly requests avatar styling.
- Use `settings.displayBadge` to enable badge rendering and keep `plugin-badge` for badge configuration only.
- Use `style` and `shape` only when the prompt explicitly requests a visual badge treatment.
- Use `icon` only when the prompt explicitly requests an icon-bearing badge.
- Use `position` only when the prompt explicitly requests a start/end badge placement override.
- Use `displayLabel` only when the prompt explicitly requests to enable or show display label.
- Include `plugin-avatar` and `plugin-badge` only when the corresponding feature content is present.
- Use only supported link positions.

# Validation Checklist
- Link actions include supported positions and explicit behavior type.
- Avatar/badge fields map to available source values.
- Badge icon and badge position values use supported fields when supplied.
