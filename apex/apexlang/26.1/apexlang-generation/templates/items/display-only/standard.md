---
templateId: items.display-only.standard
componentType: item
version: 1.0
imports:
  - display-only._common.md
description: Variable-driven display-only item patterns.
---

# Purpose

Document `displayOnly` patterns for variable-driven read-only output.

---

# Generation Rules (MANDATORY)

1. Load `templates/items/items._common.md` and `display-only._common.md` first.
2. Use display-only items only for read-only output and never as editable input controls.
3. Keep output blocks variable-driven and free of fixed demo wrappers.

---

# Variable Contract

| Name | Required | Type | Notes |
|---|---|---|---|
| itemName | yes | string | Page item static name such as `P10_STATUS`. |
| type | yes | enum | Must be `displayOnly`. |
| label.label | yes | string | Visible label text. |
| label.alignment | optional | enum | Label alignment when the label is shown. |
| layout.region | yes | alias | Host region static ID reference. |
| layout.sequence | yes | number | Rendering sequence within the region. |
| layout.slot | optional | enum | Region slot, typically `regionBody` for items rendered inside a host region. |
| layout.alignment | optional | enum | Item alignment inside the slot. |
| appearance.template | yes | alias | Family-appropriate template alias. |
| appearance.templateOptions | optional | array/string | Template modifiers such as `#DEFAULT#` or compact options. |
| settings.* | optional | variant | Normalized family settings such as `sendOnPageSubmit` and `format`. |
| help.helpText | required by default | string | Builder help text or assistive guidance for visible user-facing display-only items; omit only when the page documents an exemption. |
| security.sessionStateProtection | optional | enum | Session state protection policy. |
| security.authorizationScheme | optional | alias | Authorization scheme alias when the item is conditionally visible. |

---

# Output Templates

## Static Value



```apexlang
pageItem {{itemName}} (
    type: displayOnly
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
        sendOnPageSubmit: false
        format: plainText
    }
    source {
        type: staticValue
        staticValue: {{source.staticValue}}
    }
)
```



## Item Value



```apexlang
pageItem {{itemName}} (
    type: displayOnly
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
        sendOnPageSubmit: false
        format: {{settings.format}}
    }
    source {
        type: item
        item: {{source.item}}
    }
)
```



## SQL Single Value



````apexlang
pageItem {{itemName}} (
    type: displayOnly
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
        sendOnPageSubmit: false
    }
    source {
        type: sqlQuerySingleValue
        sqlQuery:
            ```sql
            {{source.sqlQuery}}
            ```
    }
)
````



## SQL Multiple Value



````apexlang
pageItem {{itemName}} (
    type: displayOnly
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
        sendOnPageSubmit: false
    }
    source {
        type: sqlQueryMultipleValue
        sqlQuery:
            ```sql
            {{source.sqlQuery}}
            ```
    }
)
````

---

# Conditional Rendering Rules

- Choose one display source per item and remove the unused source attributes.
- Keep `settings.sendOnPageSubmit` fixed to `false` for every display-only output block.
- For region-bound display-only items, use `layout.slot: regionBody` unless the host region template explicitly exposes a different item slot.
- When a display-only item mirrors another page item's current value, use `source.type: item` plus `source.item`; do not emit `source.type: substitutionString`.

---

# Guardrails

- Do not attach editable input attributes or input validations to display-only items.
- Treat rendered HTML, Markdown, and SQL-backed output as potentially unsafe unless the surrounding flow sanitizes it.
