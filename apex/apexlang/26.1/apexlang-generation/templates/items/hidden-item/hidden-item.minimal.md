---
templateId: items.hidden-item.minimal
componentType: item
version: 1.0
imports:
  - hidden-item._common.md
description: hidden-item variant minimal.
---

# Purpose

Scenario overlay for `hidden-item` items focused on `minimal` behavior.

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

- `security.sessionStateProtection` defaults to `checksumRequiredSessionLevel`

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
    security {
        sessionStateProtection: checksumRequiredSessionLevel
    }
)
```

---

# Conditional Rendering Rules

- Do not omit the security block for hidden items in generated business pages.
- Keep the item block minimal and rely on the inherited family contract for anything not shown here.
- Remove optional blocks that are not populated by the final prompt.

---

# Guardrails

- Keep `hidden-item._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
