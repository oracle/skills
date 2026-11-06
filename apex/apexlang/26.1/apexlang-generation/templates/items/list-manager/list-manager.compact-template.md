---
templateId: items.list-manager.compact-template
componentType: item
version: 1.0
imports:
  - list-manager._common.md
description: list-manager variant compact-template.
---

# Purpose

Scenario overlay for `list-manager` items focused on `compact-template` behavior.

---

# Generation Rules (MANDATORY)

1. Load `list-manager._common.md` and `templates/items/items._common.md` before using this overlay.
2. Inherit the family contract and add only the scenario-specific placeholders listed below.
3. Remove blocks that are not required by the final prompt before finalizing the item DSL.

---

# Variable Contract

Inherits the full family contract from `list-manager._common.md`. Base family requirements such as `itemName`, `layout.region`, and `layout.sequence` still apply.

## Required Variables

- `appearance.templateOptions`

## Optional Variables

- `label.alignment`
- `layout.slot`
- `layout.alignment`
- `security.sessionStateProtection`

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: listManager
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
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```

---

# Conditional Rendering Rules

- Use `appearance.templateOptions` only when the requested control needs compact or condensed rendering.
- Keep the rest of the item aligned with the inherited family contract.

---

# Guardrails

- Keep `list-manager._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
