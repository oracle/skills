---
templateId: content-row.report-primary-actions-menu
componentType: templateComponent
imports:
  - content-row.common
version: 1.0
description: Report-mode primary actions with button and menu templates.
---

# Purpose
Document Content Row primary actions using supported templates: `button` and `menu`.

# Output Template
```apx
region {{regionStaticId}} (
    type: themeTemplateComponent/contentRow
    componentAppearance { display: report }
    action {{buttonActionId}} (
        position: primaryActions
        template: button
        label: {{buttonLabel}}
        layout {
            sequence: 10
        }
        behavior {
            type: redirectUrl
            targetUrl: {{buttonTargetUrl}}
        }
        appearance {
            displayType: icon
            icon: {{buttonIcon}}
        }
    )
    action {{menuActionId}} (
        position: primaryActions
        template: menu
        label: {{menuLabel}}
        layout {
            sequence: 20
        }
        appearance {
            displayType: icon
            icon: {{menuIcon}}
        }

        menu {{menuEntryId}} (
            label: {{menuEntryLabel}}
            layout {
                sequence: 10
            }
            behavior {
                type: redirectUrl
                targetUrl: {{menuEntryTargetUrl}}
            }
        )
    )
)
```

# Conditional Rendering Rules
- For `position: primaryActions`, allow only `template: button` or `template: menu`.
- Render nested `menu` entries only for `template: menu`.
- Close each `action ... (` component with `)` after all nested blocks.

# Validation Checklist
- No unsupported `primaryActions` template is used.
- Menu entries include deterministic sequence and behavior.
