---
templateId: items.select-list.explicit-defaults
componentType: item
version: 1.0
imports:
  - select-list._common.md
description: select-list variant explicit-defaults.
---

# Purpose

Scenario overlay for `select-list` items focused on `explicit-defaults` behavior.

---

# Generation Rules (MANDATORY)

1. Load `select-list._common.md` and `templates/items/items._common.md` before using this overlay.
2. Inherit the family contract and add only the scenario-specific placeholders listed below.
3. Remove blocks that are not required by the final prompt before finalizing the item DSL.

---

# Variable Contract

Inherits the full family contract from `select-list._common.md`. Base family requirements such as `itemName`, `layout.region`, and `layout.sequence` still apply.

## Required Variables

- None beyond the inherited family contract.

## Optional Variables

- `label.alignment`
- `layout.slot`
- `layout.alignment`
- `appearance.templateOptions`
- `security.sessionStateProtection`
- `cascadingLov.parentItems`

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: selectList
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
    cascadingLov {
        parentItems: {{cascadingLov.parentItems}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```

---

# Conditional Rendering Rules

- Show optional defaults only when the generator needs them visible in the final output.
- Remove the `cascadingLov {}` block when no cascading LOV parent is required.

---

# Guardrails

- Keep `select-list._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
