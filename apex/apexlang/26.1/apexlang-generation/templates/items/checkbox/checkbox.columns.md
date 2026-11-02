---
templateId: items.checkbox.columns
componentType: item
version: 1.0
imports:
  - checkbox._common.md
description: checkbox variant columns.
---

# Purpose

Scenario overlay for `checkbox` items focused on `columns` behavior.

---

# Generation Rules (MANDATORY)

1. Load `checkbox._common.md` and `templates/items/items._common.md` before using this overlay.
2. Inherit the family contract and add only the scenario-specific placeholders listed below.
3. Remove blocks that are not required by the final prompt before finalizing the item DSL.

---

# Variable Contract

Inherits the full family contract from `checkbox._common.md`. Base family requirements such as `itemName`, `layout.region`, and `layout.sequence` still apply.

## Required Variables

- `settings.noOfCols`

## Optional Variables

- `appearance.templateOptions`
- `security.sessionStateProtection`

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

- Keep column counts in sync with the option density and the available region width.
- Do not use multi-column output for long option labels or crowded layouts.

---

# Guardrails

- Keep `checkbox._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
