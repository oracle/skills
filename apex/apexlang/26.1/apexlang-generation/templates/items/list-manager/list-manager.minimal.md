---
templateId: items.list-manager.minimal
componentType: item
version: 1.0
imports:
  - list-manager._common.md
description: list-manager variant minimal.
---

# Purpose

Scenario overlay for `list-manager` items focused on `minimal` behavior.

---

# Generation Rules (MANDATORY)

1. Load `list-manager._common.md` and `templates/items/items._common.md` before using this overlay.
2. Inherit the family contract and add only the scenario-specific placeholders listed below.
3. Remove blocks that are not required by the final prompt before finalizing the item DSL.

---

# Variable Contract

Inherits the full family contract from `list-manager._common.md`. Base family requirements such as `itemName`, `layout.region`, and `layout.sequence` still apply.

## Required Variables

- None beyond the inherited family contract.

## Optional Variables

- `security.sessionStateProtection`

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: listManager
    label {
        label: {{label.label}}
    }
    layout {
        sequence: {{layout.sequence}}
        region: @{{layout.region}}
        slot: {{layout.slot}}
    }
    appearance {
        template: {{appearance.template}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```

---

# Conditional Rendering Rules

- Keep the item block minimal and rely on the inherited family contract for anything not shown here.
- Remove optional blocks that are not populated by the final prompt.

---

# Guardrails

- Keep `list-manager._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
