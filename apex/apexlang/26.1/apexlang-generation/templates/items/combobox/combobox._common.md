---
templateId: items.combobox.common
componentType: item
version: 2.0
canonicalDslType: combobox
nativeType: NATIVE_COMBOBOX
description: Canonical contract for combobox item templates.
---

# Purpose

Define the canonical contract, conditional rules, and output skeleton for `combobox` items.

---

# Generation Rules (MANDATORY)

1. Load `templates/items/items._common.md` first.
2. Load `references/policies/memory-bank/40-components/apex.items.md` before drafting final item DSL.
3. Use this family only for `combobox` semantics and remove attributes that belong to other item families.
4. Keep scenario overlays in the family templates and keep reusable contract details in this common file.

---

# Variable Contract

| Name | Required | Type | Notes |
|---|---|---|---|
| itemName | yes | string | Page item static name such as `P10_STATUS`. |
| type | yes | enum | Must be `combobox`. |
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
| lov.type | conditional | enum | `staticValues`, `sqlQuery`, or `sharedComponent`. |
| lov.staticValues | conditional | string | Inline static LOV entries when `lov.type = staticValues`. |
| lov.sqlQuery | conditional | sql | SQL returning display and return columns when `lov.type = sqlQuery`. |
| lov.lov | conditional | alias | Shared LOV alias when `lov.type = sharedComponent`. |
| settings.* | optional | variant | Normalized family settings such as `matchType`, `caseSensitive`, `valueHtmlExpression`, `fetchOnSearch`, `maxValuesInList`, `multiSelection`, `minChars`, `useCache`, and `manualEntriesItem`. |
| validation.valueRequired | optional | boolean | Set when the item value is mandatory. |
| source.formRegion | conditional | alias | Required for form-bound items. |
| source.column | conditional | string | Target column for form-bound items. |
| source.dataType | conditional | enum | Data type for DML binding. |
| help.helpText | required by default | string | Builder help text or assistive guidance for visible user-facing combobox items; omit only for hidden items or a documented exemption. |
| security.sessionStateProtection | optional | enum | Session state protection policy. |
| security.authorizationScheme | optional | alias | Authorization scheme alias when the item is conditionally visible. |

---

# Output Skeleton Template

````apexlang
pageItem {{itemName}} (
    type: combobox
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
    lov {
        type: {{lov.type}}
        staticValues: {{lov.staticValues}}
        sqlQuery:
            ```sql
            {{lov.sqlQuery}}
            ```
        lov: @{{lov.lov}}
    }
    settings {
        matchType: {{settings.matchType}}
        caseSensitive: {{settings.caseSensitive}}
        valueHtmlExpression: {{settings.valueHtmlExpression}}
        fetchOnSearch: {{settings.fetchOnSearch}}
        maxValuesInList: {{settings.maxValuesInList}}
        multiSelection: {{settings.multiSelection}}
        minChars: {{settings.minChars}}
        useCache: {{settings.useCache}}
        manualEntriesItem: {{settings.manualEntriesItem}}
    }
    validation {
        valueRequired: {{validation.valueRequired}}
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
````

---

# Conditional Rendering Rules

- Remove unsupported or unused blocks before finalizing the DSL.
- Choose exactly one LOV source and remove the unused LOV attributes.
- Omit `source {}` when the item is not bound to persisted data or a form region.
- Emit `validation {}` only when the scenario requires declarative checks.
- Keep width, placeholder, and format-mask attributes absent unless the scenario explicitly asks for them.
- Keep the settings block lean and emit only the family-specific properties that are actually needed.

---

# Guardrails

- Follow guardrails in `references/policies/memory-bank/00-guard/ai.guard.md`.
- Do not invent unsupported attributes or UT classes.
- Keep placeholder names aligned with `templates/items/items._common.md`.
- Prefer shared LOV aliases when options are reused across pages.
- Keep the generated item aligned with the target column type and the intended user interaction.
