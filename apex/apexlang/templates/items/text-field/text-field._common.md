---
templateId: items.textField.common
componentType: item
version: 2.0
canonicalDslType: textField
nativeType: NATIVE_TEXT_FIELD
description: Canonical contract for text-field item templates.
---

# Purpose

Define the canonical contract, conditional rules, and output skeleton for `text-field` items.

---

# Generation Rules (MANDATORY)

1. Load `templates/items/items._common.md` first.
2. Load `references/policies/memory-bank/40-components/apex.items.md` before drafting final item DSL.
3. Use this family only for `textField` semantics and remove attributes that belong to other item families.
4. Keep scenario overlays in the family templates and keep reusable contract details in this common file.

---

# Variable Contract

| Name | Required | Type | Notes |
|---|---|---|---|
| itemName | yes | string | Page item static name such as `P10_STATUS`. |
| type | yes | enum | Must be `textField`. |
| label.label | yes | string | Visible label text. |
| label.alignment | optional | enum | Label alignment when the label is shown. |
| layout.region | yes | alias | Host region static ID reference. |
| layout.sequence | yes | number | Rendering sequence within the region. |
| layout.slot | optional | enum | Region slot, typically `regionBody` for items rendered inside a host region. |
| layout.alignment | optional | enum | Item alignment inside the slot. |
| appearance.template | yes | alias | Family-appropriate template alias. |
| appearance.templateOptions | optional | array/string | Template modifiers such as `#DEFAULT#` or compact options. |
| appearance.width | optional | number | Width or character width when the family supports it. |
| appearance.valuePlaceholder | optional | string | Placeholder or helper text shown before a value is entered. |
| settings.* | optional | variant | Normalized family settings such as `submitWhenEnterPressed`, `disabled`, `sendOnPageSubmit`, `subtype`, `trimSpaces`, and `textCase`. |
| validation.valueRequired | optional | boolean | Set when the item value is mandatory. |
| validation.maxLength | optional | number | Maximum character length when the scenario enforces it. |
| source.formRegion | conditional | alias | Required for form-bound items. |
| source.column | conditional | string | Target column for form-bound items. |
| source.dataType | conditional | enum | Data type for DML binding. |
| help.helpText | required by default | string | Builder help text or assistive guidance for visible user-facing text fields; omit only for hidden items or a documented exemption. |
| security.sessionStateProtection | optional | enum | Session state protection policy. |
| security.authorizationScheme | optional | alias | Authorization scheme alias when the item is conditionally visible. |

---

# Output Skeleton Template

```apexlang
pageItem {{itemName}} (
    type: textField
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
        width: {{appearance.width}}
        valuePlaceholder: {{appearance.valuePlaceholder}}
    }
    settings {
        submitWhenEnterPressed: {{settings.submitWhenEnterPressed}}
        disabled: {{settings.disabled}}
        sendOnPageSubmit: {{settings.sendOnPageSubmit}}
        subtype: {{settings.subtype}}
        trimSpaces: {{settings.trimSpaces}}
        textCase: {{settings.textCase}}
    }
    validation {
        valueRequired: {{validation.valueRequired}}
        maxLength: {{validation.maxLength}}
    }
    source {
        formRegion: @{{source.formRegion}}
        column: {{source.column}}
        dataType: {{source.dataType}}
    }
    help {
        helpText: {{help.helpText}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
        authorizationScheme: @{{security.authorizationScheme}}
    }
)
```

---

# Conditional Rendering Rules

- Remove unsupported or unused blocks before finalizing the DSL.
- Omit `source {}` when the item is not bound to persisted data or a form region.
- Emit `validation {}` only when the scenario requires declarative checks.
- For form-bound textual columns, `validation.maxLength` is not optional in practice: set it to the bound column length exactly.
- Keep width, placeholder, and format-mask attributes absent unless the scenario explicitly asks for them.
- Emit native text-field `settings {}` properties only when compiler/export evidence proves the specific plugin attributes; absence from the generic page-item grammar is not a rejection.
- Do not emit `validation.minLength`; current item validation supports `valueRequired` and `maxLength`.

---

# Guardrails

- Follow guardrails in `references/policies/memory-bank/00-guard/ai.guard.md`.
- Do not invent unsupported attributes or UT classes.
- Keep placeholder names aligned with `templates/items/items._common.md`.
- Keep the generated item aligned with the target column type and the intended user interaction.
