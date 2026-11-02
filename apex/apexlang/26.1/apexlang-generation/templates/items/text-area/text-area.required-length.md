---
templateId: items.text-area.required-length
componentType: item
version: 1.0
imports:
  - text-area._common.md
description: text-area variant required-length.
---

# Purpose

Scenario overlay for `text-area` items focused on `required-length` behavior.

---

# Generation Rules (MANDATORY)

1. Load `text-area._common.md` and `templates/items/items._common.md` before using this overlay.
2. Inherit the family contract and add only the scenario-specific placeholders listed below.
3. Remove blocks that are not required by the final prompt before finalizing the item DSL.

---

# Variable Contract

Inherits the full family contract from `text-area._common.md`. Base family requirements such as `itemName`, `layout.region`, and `layout.sequence` still apply.

## Required Variables

- `validation.valueRequired`
- `validation.maxLength`

## Optional Variables

- `appearance.templateOptions`
- `security.sessionStateProtection`

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: textarea
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
    validation {
        valueRequired: {{validation.valueRequired}}
        maxLength: {{validation.maxLength}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```

---

# Conditional Rendering Rules

- Use this overlay only for textual families where declarative length checks are relevant.
- Keep validation limited to `valueRequired` and `maxLength` under the current grammar.

---

# Guardrails

- Keep `text-area._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
