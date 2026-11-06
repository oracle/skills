---
templateId: items.checkbox.explicit-defaults
componentType: item
version: 1.0
imports:
  - checkbox._common.md
description: checkbox variant explicit-defaults.
---

# Purpose

Scenario overlay for `checkbox` items focused on `explicit-defaults` behavior.

---

# Generation Rules (MANDATORY)

1. Load `checkbox._common.md` and `templates/items/items._common.md` before using this overlay.
2. Inherit the family contract and add only the scenario-specific placeholders listed below.
3. Remove blocks that are not required by the final prompt before finalizing the item DSL.

---

# Variable Contract

Inherits the full family contract from `checkbox._common.md`. Base family requirements such as `itemName`, `layout.region`, and `layout.sequence` still apply.

## Required Variables

- None beyond the inherited family contract.

## Optional Variables

- `label.alignment`
- `layout.slot`
- `layout.alignment`
- `appearance.templateOptions`
- `security.sessionStateProtection`
- `settings.noOfCols`

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: checkbox
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
        noOfCols: {{settings.noOfCols}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```

---

# Conditional Rendering Rules

- Show optional defaults only when the generator needs them visible in the final output.
- Remove family-specific settings that are not relevant to the requested prompt.

---

# Guardrails

- Keep `checkbox._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
