---
templateId: badge.report-link
componentType: templateComponent
imports:
  - badge._common.md
version: 1.0
description: Report-mode Badge with its single supported link action.
---

# Purpose

Render a Badge whose row navigates to a resolved same-application target.

# Output Template

```apexlang
region {{regionStaticId}} (
    name: {{name}}
    type: themeTemplateComponent/badge
    componentAppearance {
        display: report
    }
    source {
        location: localDatabase
        type: sqlQuery
        sqlQuery: ```
{{source.sqlQuery}}
```
    }
    settings {
        label: {{settings.label}}
        value: {{settings.valueColumn}}
    }
    action {{actionId}} (
        position: link
        layout {
            sequence: {{action.sequence}}
        }
        behavior {
            type: redirectThisApp
            target: {
                page: {{targetPageId}}
                items: {
                    {{targetItem}}: &{{sourceKeyColumn}}.
                }
            }
        }
    )
    {{columns}}
)
```

# Conditional Rendering Rules

- Use this scenario only when the target page, target item, and source key are resolved.
- Omit `action.template`; Badge has no action templates.
- Set a deterministic numeric `action.layout.sequence`; the live compiler requires it.
- Add the complete verified source plus explicit column contract from `badge._common.md`.

# Validation Checklist

- Action position is exactly `link`.
- Action includes numeric `layout.sequence`.
- Target is a structured same-application target.
- Source key is projected and marked as the row identity when required.
- Target page applies the same or stricter authorization than the Badge visibility rule.
