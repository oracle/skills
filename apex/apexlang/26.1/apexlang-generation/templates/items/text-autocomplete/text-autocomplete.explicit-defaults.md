---
templateId: items.text-autocomplete.explicit-defaults
componentType: item
version: 1.0
imports:
  - text-autocomplete._common.md
description: text-autocomplete variant explicit-defaults.
---

# Purpose

Scenario overlay for `text-autocomplete` items focused on `explicit-defaults` behavior.

---

# Generation Rules (MANDATORY)

1. Load `text-autocomplete._common.md` and `templates/items/items._common.md` before using this overlay.
2. Inherit the family contract and add only the scenario-specific placeholders listed below.
3. Remove blocks that are not required by the final prompt before finalizing the item DSL.

---

# Variable Contract

Inherits the full family contract from `text-autocomplete._common.md`. Base family requirements such as `itemName`, `layout.region`, and `layout.sequence` still apply.

## Required Variables

- None beyond the inherited family contract.

## Optional Variables

- `label.alignment`
- `layout.slot`
- `layout.alignment`
- `appearance.templateOptions`
- `security.sessionStateProtection`
- `settings.infiniteScroll`
- `settings.fetchOnType`
- `settings.maxValuesInList`
- `settings.useCache`
- `search.matchType`
- `search.minChars`

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: textFieldWithAutocomplete
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
        infiniteScroll: {{settings.infiniteScroll}}
        fetchOnType: {{settings.fetchOnType}}
        maxValuesInList: {{settings.maxValuesInList}}
        useCache: {{settings.useCache}}
    }
    search {
        matchType: {{search.matchType}}
        minChars: {{search.minChars}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```

---

# Conditional Rendering Rules

- Show optional defaults only when the generator needs them visible in the final output.
- Emit native text-autocomplete `settings {}` or `search {}` properties only when compiler/export evidence proves the specific plugin attributes; absence from the generic page-item grammar is not a rejection.

---

# Guardrails

- Keep `text-autocomplete._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
