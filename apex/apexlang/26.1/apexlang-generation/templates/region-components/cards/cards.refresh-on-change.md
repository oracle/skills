---
templateId: region.cards.refresh-on-change
componentType: dynamicAction
version: 1.0
imports:
  - cards._common
description: Refresh one Cards region when one or more page items change.
---

# Purpose

Add a targeted, declarative Refresh dynamic action to a Cards page without changing the shared Dynamic Action templates used by other region families.

# Cards Source Companion Shape

When the Cards SQL or REST operation reads the trigger items, emit the same exact aliases on the Cards source:

```apexlang
source {
    pageItemsToSubmit: {{source.pageItemsToSubmit}}
}
```

`source.pageItemsToSubmit` is an array. It must include every page-item bind read by the refreshed Cards source.

# Output Template

```apexlang
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: change
        selectionType: items
        items: {{when.items}}
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

- Resolve every trigger item and the Cards region static ID before rendering.
- Target exactly one Cards region. Use separate actions only when the request explicitly names additional targets.
- Put page-item submission on the Cards `source.pageItemsToSubmit`; do not emit `itemsToSubmit` settings on the Refresh action.
- Do not emit action-level `execution.event`, JavaScript refresh code, polling, Faceted Search, or Smart Filters orchestration.
