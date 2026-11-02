---
templateId: region.cards.refresh-after-dialog
componentType: dynamicAction
version: 1.0
imports:
  - cards._common
description: Refresh one Cards region after a modal dialog closes.
---

# Purpose

Refresh a Cards result set after its modal create/edit flow closes, while keeping the behavior isolated from shared Dynamic Action templates.

# Output Template

```apexlang
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: apexafterclosedialog
        selectionType: region
        region: @{{dialogLaunchRegionStaticId}}
    }
    action {{action.name}} (
        action: refresh
        affectedElements {
            selectionType: region
            region: @{{cardsRegionStaticId}}
        }
        execution {
            sequence: {{action.execution.sequence}}
            fireOnInit: false
        }
    )
)
```

# Guardrails

- Resolve the dialog-launch region and target Cards region aliases before rendering.
- Use `apexafterclosedialog` for successful dialog-close refresh. Do not invent event aliases.
- If the refreshed Cards source reads parent-page items, list them on its `source.pageItemsToSubmit`.
- Do not emit action-level `execution.event`, Refresh-action `itemsToSubmit`, JavaScript refresh code, or unrelated region targets.
