---
templateId: items.display-only.common
componentType: item
version: 2.0
canonicalDslType: displayOnly
description: Display-only item contract for read-only value rendering.
---

# Purpose

Define the canonical contract, conditional rules, governance, and output skeleton for `display-only` items.

# Generation Rules (MANDATORY)

1. Load `templates/items/items._common.md` first.
2. Load `references/policies/memory-bank/40-components/apex.items.md` before drafting final item DSL.
3. Use this family only for `displayOnly` semantics; do not mix with other family-only attributes.
4. For `displayOnly` items, always emit `settings.sendOnPageSubmit: false`; existing page examples are not authoritative for required properties.

Checklist: For `displayOnly` items, verify `settings.sendOnPageSubmit: false` before finalizing output.

# Variable Contract

| Name | Required | Notes |
|---|---|---|
| itemName | yes | Page item static name (`PXX_<NAME>`). |
| type | yes | Must be `displayOnly`. |
| label.label | conditional | Visible label text; omit only for non-visual contexts. |
| layout.region | yes | Host region static ID reference. |
| layout.sequence | yes | Rendering sequence. |
| layout.slot | conditional | When `layout.region` is present, use the host region slot such as `regionBody`; do not use page-level slots like `body` or `BODY` for region-bound items. |
| appearance.template | yes | Family-appropriate template alias. |
| appearance.templateOptions | optional | `#DEFAULT#` unless a supported display-only variant needs more. |
| validation.valueRequired | conditional | Required when the prompt enforces mandatory selection/value. |
| settings.sendOnPageSubmit | yes | Must be `false` for display-only items. |
| settings.* | conditional | Family-specific settings only when explicitly needed and supported by schema. |
| source.* | conditional | Use compiler-valid source types only. For current page-item mirroring, prefer `source.type: item` with `source.item`. |

# Conditional Rendering Rules

- Include only properties supported by `displayOnly`.
- In `appearance`, emit only `template` and `templateOptions`; do not emit `width` or `height`.
- Always emit `settings.sendOnPageSubmit: false`, even if local page examples omit it.
- Omit source blocks when no display value source is needed.
- Emit validation blocks only when the prompt requires validation behavior.
- Keep optional settings absent unless the scenario explicitly needs them.
- When `layout.region` is present, emit `layout.slot: regionBody` unless the host region template explicitly requires a different item slot.
- Do not emit `source.type: substitutionString`; compiler-valid display-only source types include `item`, `staticValue`, `sqlQuerySingleValue`, `sqlQueryMultipleValues`, `databaseColumn`, `expression`, `functionBody`, `preference`, and `null`.

# Governance

- Follow guardrails in `references/policies/memory-bank/00-guard/ai.guard.md`.
- Do not invent unsupported attributes or UT classes.
- Keep SQL/PLSQL blocks wrapped in triple backticks when used.
- Preserve naming, security, and session-state conventions from `items._common.md`.

# Output Skeleton Template

```apexlang
pageItem {{itemName}} (
    type: displayOnly
    label {
        label: {{label.label}}
        alignment: left
    }
    layout {
        sequence: {{layout.sequence}}
        region: @{{layout.region}}
        slot: regionBody
    }
    appearance {
        template: {{appearance.template}}
        templateOptions: #DEFAULT#
    }
    settings {
        sendOnPageSubmit: false
    }
)
```
