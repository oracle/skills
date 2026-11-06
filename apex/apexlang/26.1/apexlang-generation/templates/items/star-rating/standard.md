---
templateId: items.star-rating.standard
componentType: item
version: 1.0
imports:
  - star-rating._common.md
description: Variable-driven star-rating item pattern.
---

# Purpose

Provide a variable-driven `starRating` pattern for score and rating controls.

---

# Generation Rules (MANDATORY)

1. Load `templates/items/items._common.md` and `star-rating._common.md` first.
2. Use this template when the page needs a bounded rating control rather than a generic numeric field.
3. Keep the output limited to a `pageItem` block with substitution-driven placeholders.

---

# Variable Contract

| Name | Required | Type | Notes |
|---|---|---|---|
| itemName | yes | string | Page item static name such as `P10_STATUS`. |
| type | yes | enum | Must be `starRating`. |
| label.label | yes | string | Visible label text. |
| label.alignment | optional | enum | Label alignment when the label is shown. |
| layout.region | yes | alias | Host region static ID reference. |
| layout.sequence | yes | number | Rendering sequence within the region. |
| layout.slot | optional | enum | Region slot, typically `regionBody` for items rendered inside a host region. |
| layout.alignment | optional | enum | Emit only when the active compiler/runtime explicitly supports star-rating layout alignment. |
| appearance.template | yes | alias | Family-appropriate template alias. |
| appearance.templateOptions | optional | array/string | Template modifiers such as `#DEFAULT#` or compact options. |
| settings.* | optional | variant | Emit only compiler-proven star-rating settings. Treat `maximumRating` and `allowHalfSelection` as version-sensitive and omit them by default. |
| validation.valueRequired | optional | boolean | Set when the item value is mandatory. |
| source.formRegion | conditional | alias | Required for form-bound items. |
| source.column | conditional | string | Target column for form-bound items. |
| source.dataType | conditional | enum | Data type for DML binding. |
| help.helpText | required by default | string | Builder help text or assistive guidance for visible user-facing star-rating items; omit only for hidden items or a documented exemption. |
| security.sessionStateProtection | optional | enum | Session state protection policy. |
| security.authorizationScheme | optional | alias | Authorization scheme alias when the item is conditionally visible. |

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: starRating
    label {
        label: {{label.label}}
        alignment: {{label.alignment}}
    }
    layout {
        sequence: {{layout.sequence}}
        region: @{{layout.region}}
        slot: {{layout.slot}}
    }
    appearance {
        template: {{appearance.template}}
        templateOptions: {{appearance.templateOptions}}
    }
    validation {
        valueRequired: {{validation.valueRequired}}
    }
    source {
        formRegion: @{{source.formRegion}}
        column: {{source.column}}
        dataType: {{source.dataType}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```

---

# Conditional Rendering Rules

- Start from a minimal star-rating item with no `layout.alignment` and no `settings {}` block unless the active compiler/runtime has already proven those properties valid.
- For APEXlang compiler/runtime `26.1.0+3102`, treat `layout.alignment`, `settings.maximumRating`, and `settings.allowHalfSelection` as unsupported and omit them.
- Emit `source {}` only when the rating is persisted or form-bound.

---

# Guardrails

- Prefer live `apex validate` evidence over template prose when star-rating properties disagree across runtimes.
- Keep the configured rating scale aligned with downstream reporting and storage expectations.
- Use accessible labels or helper text when icon-only ratings would otherwise be ambiguous.
