---
templateId: items.number-field.format-mask
componentType: item
version: 1.0
imports:
  - number-field._common.md
description: number-field variant format-mask.
---

# Purpose

Scenario overlay for `number-field` items focused on `format-mask` behavior.

---

# Generation Rules (MANDATORY)

1. Load `number-field._common.md` and `templates/items/items._common.md` before using this overlay.
2. Inherit the family contract and add only the scenario-specific placeholders listed below.
3. Remove blocks that are not required by the final prompt before finalizing the item DSL.

---

# Variable Contract

Inherits the full family contract from `number-field._common.md`. Base family requirements such as `itemName`, `layout.region`, and `layout.sequence` still apply.

## Required Variables

- `appearance.formatMask`

## Optional Variables

- `appearance.templateOptions`
- `security.sessionStateProtection`
- `validation.valueRequired`

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: numberField
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
    validation {
        valueRequired: {{validation.valueRequired}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```

---

# Conditional Rendering Rules

- Use the format mask only when the numeric family requires explicit formatting behavior.
- Keep additional validation or settings out of the output unless the prompt asks for them.

---

# Guardrails

- Keep `number-field._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
