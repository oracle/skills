---
templateId: items.selectList.common
componentType: item
version: 2.0
canonicalDslType: selectList
nativeType: NATIVE_SELECT_LIST
description: Canonical contract for select-list item templates.
---

# Purpose

Define the canonical contract, conditional rules, and output skeleton for `select-list` items.

---

# Generation Rules (MANDATORY)

1. Load `templates/items/items._common.md` first.
2. Load `references/policies/memory-bank/40-components/apex.items.md` before drafting final item DSL.
3. Use this family only for `selectList` semantics and remove attributes that belong to other item families.
4. Keep scenario overlays in the family templates and keep reusable contract details in this common file.

---

# Variable Contract

| Name | Required | Type | Notes |
|---|---|---|---|
| itemName | yes | string | Page item static name such as `P10_STATUS`. |
| type | yes | enum | Must be `selectList`. |
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
| lov.displayNullValue | optional | boolean | Include the null display entry when the scenario requires it. |
| cascadingLov.parentItems | optional | item list | Parent item list used when the LOV cascades from another item. |
| validation.valueRequired | optional | boolean | Set when the item value is mandatory. |
| source.formRegion | conditional | alias | Required for form-bound items. |
| source.column | conditional | string | Target column for form-bound items. |
| source.dataType | conditional | enum | Data type for DML binding. |
| comments.comments | optional | string | Builder note used for rationale such as unrestricted client-side-owned session state. |
| help.helpText | required by default | string | Builder help text or assistive guidance for visible user-facing select lists; omit only for hidden items or a documented exemption. |
| security.sessionStateProtection | optional | enum | Session state protection policy. |

---

# Output Skeleton Template

````apexlang
pageItem {{itemName}} (
    type: selectList
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
        type: {{lov.type}}
        staticValues: {{lov.staticValues}}
        sqlQuery:
            ```sql
            {{lov.sqlQuery}}
            ```
        lov: @{{lov.lov}}
        displayNullValue: {{lov.displayNullValue}}
    }
    cascadingLov {
        parentItems: {{cascadingLov.parentItems}}
    }
    validation {
        valueRequired: {{validation.valueRequired}}
    }
    source {
        formRegion: @{{source.formRegion}}
        column: {{source.column}}
        dataType: {{source.dataType}}
    }
    comments {
        comments: {{comments.comments}}
    }
    help {
        helpText: {{help.helpText}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
````

---

# Conditional Rendering Rules

- Remove unsupported or unused blocks before finalizing the DSL.
- Choose exactly one LOV source and remove the unused LOV attributes.
- For `lov.type = sqlQuery`, return the display column first and the return column second.
- Canonical inline LOV SQL shape:
  ```sql
  select [displayValue],
         [returnValue]
    from ...
   where ...
   order by ...
  ```
- Use `displayNullValue` only when the family and scenario support a blank selection.
- Omit `source {}` when the item is not bound to persisted data or a form region.
- Omit `comments {}` unless a builder rationale materially helps maintenance or is required by a guardrail.
- Emit `validation {}` only when the scenario requires declarative checks.
- Emit `cascadingLov {}` only when the LOV depends on one or more parent items.

---

# Guardrails

- Follow guardrails in `references/policies/memory-bank/00-guard/ai.guard.md`.
- Do not invent unsupported attributes or UT classes.
- Keep placeholder names aligned with `templates/items/items._common.md`.
- Prefer shared LOV aliases when options are reused across pages.
- Keep the generated item aligned with the target column type and the intended user interaction.
