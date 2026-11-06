---
templateId: items.combobox.lov-shared
componentType: item
version: 1.0
imports:
  - combobox._common.md
description: combobox variant lov-shared.
---

# Purpose

Scenario overlay for `combobox` items focused on `lov-shared` behavior.

---

# Generation Rules (MANDATORY)

1. Load `combobox._common.md` and `templates/items/items._common.md` before using this overlay.
2. Inherit the family contract and add only the scenario-specific placeholders listed below.
3. Remove blocks that are not required by the final prompt before finalizing the item DSL.

---

# Variable Contract

Inherits the full family contract from `combobox._common.md`. Base family requirements such as `itemName`, `layout.region`, and `layout.sequence` still apply.

## Required Variables

- `lov.lov`

## Optional Variables

- `appearance.templateOptions`
- `security.sessionStateProtection`

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: combobox
    label {
        label: {{label.label}}
        alignment: {{label.alignment}}
    }
    layout {
        sequence: {{layout.sequence}}
        region: @{{layout.region}}
        slot: {{layout.slot}}
        alignment: {{layout.alignment}}
    }
    appearance {
        template: {{appearance.template}}
        templateOptions: {{appearance.templateOptions}}
    }
    lov {
        type: sharedComponent
        lov: @{{lov.lov}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```

---

# Conditional Rendering Rules

- Reference the shared LOV alias exactly and remove inline static or SQL LOV attributes.
- Keep the item aligned with the inherited family contract for layout and appearance.

---

# Guardrails

- Keep `combobox._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
