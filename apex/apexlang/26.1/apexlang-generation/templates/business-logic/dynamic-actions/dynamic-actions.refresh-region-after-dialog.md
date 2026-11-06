---
templateId: dynamic-actions.refresh-region-after-dialog
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Refresh a region when a dialog closes.
---

# Purpose

Refresh a target region after a modal dialog completes (`apexafterclosedialog` event).

---

# Output Template – Minimal
```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: apexafterclosedialog
        selectionType: region
        region: @{{when.region}}
    }
    action {{action.name}} (
        action: refresh
        affectedElements {
            selectionType: region
            region: @{{affectedElements.region}}
        }
        execution {
            sequence: {{action.execution.sequence}}
            event: @{{dynamicActionStaticId}}
        }
    )
)
```

---

# Settings Contract

- Required:
  - none
- Optional:
  - action-specific settings only when the selected action type requires them
- Forbidden:
  - `setType`
  - `settings.code`

# Event & Execution Semantics

- Use `event: apexafterclosedialog` for post-submit or successful dialog-close refresh behavior.
- Use `event: apexafterclosecanceldialog` only when the refresh is intentionally tied to cancel-close behavior.
- Do not emit aliases such as `dialogClosed`; they are invalid for `when.event`.
- This pattern is downstream of either `cancelDialog` or process `type: closeDialog` lifecycles.

# Conditional Rendering Rules

- Target the region hosting the dialog (often the parent page region).
- Use `itemsToSubmit` if the dialog updates values required by the refreshed region.
- Remove unused fields when triggering from different selection types.
- Pair with:
  - `dynamic-actions.cancel-dialog.md` for cancel-only flows
  - `dynamic-actions.close-dialog.md` + `../processes/processes.close-dialog.md` for submit-success closure flows

# Validation Checklist

- Trigger event matches dialog close event used by the page.
- Refresh target alias exists and belongs to parent context.
- No unrelated `setValue` or JS settings keys appear in this template.
