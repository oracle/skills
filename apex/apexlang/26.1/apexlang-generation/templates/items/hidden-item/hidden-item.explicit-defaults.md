---
templateId: items.hidden-item.explicit-defaults
componentType: item
version: 1.0
imports:
  - hidden-item._common.md
description: hidden-item variant explicit-defaults.
---

# Purpose

Scenario overlay for `hidden-item` items focused on `explicit-defaults` behavior.

---

# Generation Rules (MANDATORY)

1. Load `hidden-item._common.md` and `templates/items/items._common.md` before using this overlay.
2. Inherit the family contract and add only the scenario-specific placeholders listed below.
3. Remove blocks that are not required by the final prompt before finalizing the item DSL.

---

# Variable Contract

Inherits the full family contract from `hidden-item._common.md`. Base family requirements such as `itemName`, `layout.region`, and `layout.sequence` still apply.

## Required Variables

- None beyond the inherited family contract.

## Optional Variables

- `label.alignment`
- `layout.slot`
- `layout.alignment`
- `appearance.templateOptions`
- `security.sessionStateProtection`
- `settings.valueProtected`

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: hidden
    layout {
        sequence: {{layout.sequence}}
        region: @{{layout.region}}
        slot: {{layout.slot}}
    }
    settings {
        valueProtected: {{settings.valueProtected}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```

---

# Conditional Rendering Rules

- Show optional defaults only when the generator needs them visible in the final output.
- Emit native hidden-item `settings {}` properties only when compiler/export evidence proves the specific plugin attributes; absence from the generic page-item grammar is not a rejection.

---

# Guardrails

- Keep `hidden-item._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
