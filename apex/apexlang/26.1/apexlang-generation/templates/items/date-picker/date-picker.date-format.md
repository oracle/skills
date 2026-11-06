---
templateId: items.date-picker.date-format
componentType: item
version: 1.0
imports:
  - date-picker._common.md
description: date-picker variant date-format.
---

# Purpose

Scenario overlay for `date-picker` items focused on `date-format` behavior.

---

# Generation Rules (MANDATORY)

1. Load `date-picker._common.md` and `templates/items/items._common.md` before using this overlay.
2. Inherit the family contract and add only the scenario-specific placeholders listed below.
3. Remove blocks that are not required by the final prompt before finalizing the item DSL.

---

# Variable Contract

Inherits the full family contract from `date-picker._common.md`. Base family requirements such as `itemName`, `layout.region`, and `layout.sequence` still apply.

## Required Variables

- `appearance.formatMask`

## Optional Variables

- `appearance.templateOptions`
- `security.sessionStateProtection`

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: datePicker
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
        formatMask: {{appearance.formatMask}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```

---

# Conditional Rendering Rules

- Keep the format mask compatible with the target data type and the expected user locale.
- Do not mix unrelated appearance overrides into this focused format overlay.

---

# Guardrails

- Keep `date-picker._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
