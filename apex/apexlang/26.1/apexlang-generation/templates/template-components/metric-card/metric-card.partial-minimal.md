---
templateId: metric-card.partial-minimal
componentType: templateComponent
imports:
  - metric-card.common
version: 1.0
description: Minimal partial-mode Metric Card without report-only attributes.
---

# Purpose

Render one Metric Card component without the report wrapper.

# Output Template

```apx
region {{regionStaticId}} (
    name: {{name}}
    type: themeTemplateComponent/metricCard
    layout {
        sequence: {{layout.sequence}}
        slot: body
    }
    appearance {
        template: @/blank-with-attributes
        templateOptions: #DEFAULT#
    }
    componentAppearance {
        display: partial
    }
    settings {
        title: {{settings.title}}
        metric: {{settings.metric}}
        meta: {{settings.meta}}
    }
)
```

# Conditional Rendering Rules

- Keep `settings.metric`; omit unused optional component-scope text and CSS-class properties.
- Component-scope Avatar, Badge, and `action.position: link` remain available when their complete conditional contracts are satisfied.
- Omit `settings.layout`, `settings.itemCssClasses`, `plugin-grouping`, `rowSelection`, `messages`, and `pagination`; they are report-only.
- Do not add report child columns unless a proven partial-mode source mapping actually requires them.

# Validation Checklist

- `componentAppearance.display` is `partial`.
- No report-only property or block is present.
- Avatar style is omitted for image avatars.
- Any action uses only `position: link` and one valid declarative behavior branch.
