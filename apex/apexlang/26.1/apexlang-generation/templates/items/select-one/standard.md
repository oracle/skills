---
templateId: items.select-one.standard
componentType: item
version: 1.0
imports:
  - select-one._common.md
description: Variable-driven select-one item patterns.
---

# Purpose

Document `selectOne` patterns for single-selection LOV controls.

---

# Generation Rules (MANDATORY)

1. Load `templates/items/items._common.md` and `select-one._common.md` first.
2. Use these patterns only when the requested item is a `selectOne` control.
3. Keep output blocks variable-driven and free of fixed demo wrappers.

---

# Variable Contract

| Name | Required | Type | Notes |
|---|---|---|---|
| itemName | yes | string | Page item static name such as `P10_STATUS`. |
| type | yes | enum | Must be `selectOne`. |
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
| validation.valueRequired | optional | boolean | Set when the item value is mandatory. |
| source.formRegion | conditional | alias | Required for form-bound items. |
| source.column | conditional | string | Target column for form-bound items. |
| source.dataType | conditional | enum | Data type for DML binding. |
| help.helpText | required by default | string | Builder help text or assistive guidance for visible user-facing select-one items; omit only for hidden items or a documented exemption. |
| security.sessionStateProtection | optional | enum | Session state protection policy. |
| security.authorizationScheme | optional | alias | Authorization scheme alias when the item is conditionally visible. |

---

# Output Templates

## Static Select-One



```apexlang
pageItem {{itemName}} (
    type: selectOne
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
    validation {
        valueRequired: {{validation.valueRequired}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```



## Shared LOV Select-One



```apexlang
pageItem {{itemName}} (
    type: selectOne
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
- Emit `source {}` only when the control is form-bound or persisted.

---

# Guardrails

- Prefer a shared LOV alias when the same options are reused across pages.
- Switch to a larger LOV-oriented family when the option set or interaction pattern outgrows `selectOne`.
