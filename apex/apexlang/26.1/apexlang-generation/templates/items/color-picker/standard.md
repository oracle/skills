---
templateId: items.color-picker.standard
componentType: item
version: 1.0
imports:
  - color-picker._common.md
description: Variable-driven color-picker item pattern.
---

# Purpose

Provide a variable-driven `colorPicker` pattern for color input controls.

---

# Generation Rules (MANDATORY)

1. Load `templates/items/items._common.md` and `color-picker._common.md` first.
2. Use this template only when the requested control is a true color picker instead of a fixed-option LOV.
3. Keep the output limited to a `pageItem` block with substitution-driven placeholders.

---

# Variable Contract

| Name | Required | Type | Notes |
|---|---|---|---|
| itemName | yes | string | Page item static name such as `P10_STATUS`. |
| type | yes | enum | Must be `colorPicker`. |
| label.label | yes | string | Visible label text. |
| label.alignment | optional | enum | Label alignment when the label is shown. |
| layout.region | yes | alias | Host region static ID reference. |
| layout.sequence | yes | number | Rendering sequence within the region. |
| layout.slot | optional | enum | Region slot, typically `regionBody` for items rendered inside a host region. |
| layout.alignment | optional | enum | Item alignment inside the slot. |
| appearance.template | yes | alias | Family-appropriate template alias. |
| appearance.templateOptions | optional | array/string | Template modifiers such as `#DEFAULT#` or compact options. |
| validation.valueRequired | optional | boolean | Set when the item value is mandatory. |
| source.formRegion | conditional | alias | Required for form-bound items. |
| source.column | conditional | string | Target column for form-bound items. |
| source.dataType | conditional | enum | Data type for DML binding. |
| help.helpText | required by default | string | Builder help text or assistive guidance for visible user-facing color pickers; omit only for hidden items or a documented exemption. |
| security.sessionStateProtection | optional | enum | Session state protection policy. |
| security.authorizationScheme | optional | alias | Authorization scheme alias when the item is conditionally visible. |

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: colorPicker
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

- Emit `source {}` only when the color picker is bound to a stored value.
- Use `validation.valueRequired` only when the prompt requires a mandatory color.

---

# Guardrails

- Prefer LOV-based alternatives when the page requires a curated palette rather than free-form color entry.
- Keep the stored value compatible with the target column type and expected hex format.
