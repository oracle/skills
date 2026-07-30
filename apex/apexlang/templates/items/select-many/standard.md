---
templateId: items.select-many.standard
componentType: item
version: 1.0
imports:
  - select-many._common.md
description: Variable-driven select-many item patterns.
---

# Purpose

Document `selectMany` patterns for LOV-backed multi-selection controls.

---

# Generation Rules (MANDATORY)

1. Load `templates/items/items._common.md` and `select-many._common.md` first.
2. Use `selectMany` when the requested control matches the built-in select-many interaction model.
3. Keep output blocks variable-driven and free of fixed demo wrappers.

---

# Variable Contract

| Name | Required | Type | Notes |
|---|---|---|---|
| itemName | yes | string | Page item static name such as `P10_STATUS`. |
| type | yes | enum | Must be `selectMany`. |
| label.label | yes | string | Visible label text. |
| label.alignment | optional | enum | Label alignment when the label is shown. |
| layout.region | yes | alias | Host region static ID reference. |
| layout.sequence | yes | number | Rendering sequence within the region. |
| layout.slot | optional | enum | Region slot, typically `regionBody` for items rendered inside a host region. |
| layout.alignment | optional | enum | Item alignment inside the slot. |
| appearance.template | yes | alias | Family-appropriate template alias. |
| appearance.templateOptions | optional | array/string | Template modifiers such as `#DEFAULT#` or compact options. |
| lov.type | conditional | enum | `staticValues`, `sqlQuery`, or `sharedComponent`. |
| lov.staticValues | conditional | string | Inline static LOV entries when `lov.type = staticValues`. |
| lov.sqlQuery | conditional | sql | SQL returning display and return columns when `lov.type = sqlQuery`. |
| lov.lov | conditional | alias | Shared LOV alias when `lov.type = sharedComponent`. |
| settings.* | optional | variant | Normalized family settings such as `display`. |
| validation.valueRequired | optional | boolean | Set when the item value is mandatory. |
| source.formRegion | conditional | alias | Required for form-bound items. |
| source.column | conditional | string | Target column for form-bound items. |
| source.dataType | conditional | enum | Data type for DML binding. |
| help.helpText | required by default | string | Builder help text or assistive guidance for visible user-facing multi-select items; omit only for hidden items or a documented exemption. |
| security.sessionStateProtection | optional | enum | Session state protection policy. |
| security.authorizationScheme | optional | alias | Authorization scheme alias when the item is conditionally visible. |

---

# Output Templates

## Static Select-Many Listbox



```apexlang
pageItem {{itemName}} (
    type: selectMany
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
    lov {
        type: staticValues
        staticValues: {{lov.staticValues}}
    }
    settings {
        display: listbox
    }
    validation {
        valueRequired: {{validation.valueRequired}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```



## Shared LOV Shuttle



```apexlang
pageItem {{itemName}} (
    type: selectMany
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
    lov {
        type: sharedComponent
        lov: @{{lov.lov}}
    }
    settings {
        display: shuttle
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

- Choose one LOV source per item and remove the unused LOV attributes.
- Emit native select-many display settings only when compiler/export evidence proves the specific plugin attributes; absence from the generic page-item grammar is not a rejection.

---

# Guardrails

- Document how selected values are stored and parsed downstream.
- Prefer alternative families when the option list or interaction pattern requires a different multi-select UX.
