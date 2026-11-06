---
templateId: items.switch.explicit-defaults
componentType: item
version: 1.0
imports:
  - switch._common.md
description: switch variant explicit-defaults.
---

# Purpose

Scenario overlay for `switch` items focused on `explicit-defaults` behavior.

---

# Generation Rules (MANDATORY)

1. Load `switch._common.md` and `templates/items/items._common.md` before using this overlay.
2. Inherit the family contract and add only the scenario-specific placeholders listed below.
3. Remove blocks that are not required by the final prompt before finalizing the item DSL.

---

# Variable Contract

Inherits the full family contract from `switch._common.md`. Base family requirements such as `itemName`, `layout.region`, and `layout.sequence` still apply.

## Required Variables

- None beyond the inherited family contract.

## Optional Variables

- `label.alignment`
- `layout.slot`
- `layout.alignment`
- `appearance.templateOptions`
- `security.sessionStateProtection`
- `settings.onValue`
- `settings.onLabel`
- `settings.offValue`

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: switch
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
    settings {
        onValue: {{settings.onValue}}
        onLabel: {{settings.onLabel}}
        offValue: {{settings.offValue}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```

---

# Conditional Rendering Rules

- Show optional defaults only when the generator needs them visible in the final output.
- Emit native switch `settings {}` properties only when compiler/export evidence proves the specific plugin attributes; absence from the generic page-item grammar is not a rejection.

---

# Guardrails

- Keep `switch._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
