---
templateId: region.media-list.report-link
componentType: region
version: 1.0
imports:
  - media-list._common.md
description: Media List report with its single native link action.
---

# Purpose

Make each Media List item navigable using the component's only action position.

# Output Template

```apexlang
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
    {{actionSecurityBlock}}
)
```

# Interaction Contract

- Use `redirectThisApp` and a structured target whose page, item, and row-key mapping all exist.
- Do not emit `triggerAction`; the current validator cannot prove the required owning dynamic action.

# Conditional Rendering Rules

- Emit at most one action and keep `position: link`.
- Always emit numeric `layout.sequence`; the live compiler requires it.
- Omit `template`; Media List exposes no action templates.
- Do not emit `targetUrl`, `linkAttributes`, external destinations, inline handlers, or custom keyboard/focus code.
- Project the row key through the active compiler-selected column shape and apply its identity property when supported; the template renders only fields selected by its settings/plugin mappings.
- Apply the same or stricter authorization at the target/trigger boundary; region visibility is not access control.

# Validation Checklist

- Action position, cardinality, sequence, and behavior are valid.
- Target page/item and `&SOURCE_KEY.` mapping are resolved and authorized.
- Native item content supplies an understandable accessible link name.
