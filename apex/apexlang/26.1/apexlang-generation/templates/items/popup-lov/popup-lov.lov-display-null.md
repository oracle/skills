---
templateId: items.popup-lov.lov-display-null
componentType: item
version: 1.0
imports:
  - popup-lov._common.md
description: popup-lov variant lov-display-null.
---

# Purpose

Scenario overlay for `popup-lov` items focused on `lov-display-null` behavior.

---

# Generation Rules (MANDATORY)

1. Load `popup-lov._common.md` and `templates/items/items._common.md` before using this overlay.
2. Inherit the family contract and add only the scenario-specific placeholders listed below.
3. Remove blocks that are not required by the final prompt before finalizing the item DSL.

---

# Variable Contract

Inherits the full family contract from `popup-lov._common.md`. Base family requirements such as `itemName`, `layout.region`, and `layout.sequence` still apply.

## Required Variables

- `lov.lov`
- `lov.displayNullValue`

## Optional Variables

- `appearance.templateOptions`
- `security.sessionStateProtection`

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: popupLov
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
        displayNullValue: {{lov.displayNullValue}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```

---

# Conditional Rendering Rules

- Use null-display handling only when the scenario explicitly requires a blank or optional LOV entry.
- Remove unused LOV attributes from the final item block.

---

# Guardrails

- Keep `popup-lov._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
