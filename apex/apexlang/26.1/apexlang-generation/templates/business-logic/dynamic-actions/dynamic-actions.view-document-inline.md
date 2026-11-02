---
templateId: dynamic-actions.view-document-inline
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: View a document inline by opening a dialog or window.
---

# Purpose

Open an inline document viewer when a user selects a row or clicks a button.

---

# Output Template – Full
```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: click
        selectionType: button
        button: @{{when.button}}
    }
    action {{action.name}} (
        action: viewDocument
        settings {
            documentSource: {{settings.documentSource}}
            itemsToSubmit: {{settings.itemsToSubmit}}
        }
        affectedElements {
            selectionType: region
            region: @{{affectedElements.region}}
        }
        execution {
            sequence: {{action.execution.sequence}}
            event: {{action.execution.event}}
            fireOnInit: false
        }
    )
)
```

---

# Settings Contract

- Required:
  - `settings.documentSource`
- Optional:
  - `settings.itemsToSubmit` when the document source relies on session state
- Forbidden:
  - `settings.code`
  - raw button names in `when.button` (must use `@button-static-id`)

# Conditional Rendering Rules

- Adjust `documentSource` to reference the correct column or REST endpoint.
- Provide `itemsToSubmit` when the viewer relies on session state.
- Modify the `when` block to trigger from regions or report links as needed.
- Keep `when.button` in alias format (for example `@view-document`).
- Keep `fireOnInit: false` unless initialization behavior is explicitly requested.

# Event & Execution Semantics

- Keep `execution.event` aligned to the parent dynamic action alias unless the template explicitly requires another event source.
- Keep `fireOnInit: false` by default and only enable initialization execution when explicitly requested.
- Ensure action ordering is deterministic: prerequisite actions first, mutation/submit/refresh actions last.

# Validation Checklist

- Action name and settings keys match the scenario contract.
- Selector aliases (`@...`) are used where required.
- Optional blocks not used by this scenario are removed from final output.
