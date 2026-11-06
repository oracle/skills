---
templateId: items.common
componentType: item
version: 2.0
description: Shared contract for Oracle APEX page items across item families.
---

# Purpose

Define the shared variable contract, guardrails, and base `pageItem` skeleton used by all item-family templates.

---

# Generation Rules (MANDATORY)

1. Load `references/policies/memory-bank/40-components/apex.items.md` before drafting final item DSL.
2. Resolve default visible item-template and label-treatment policy from `references/policies/memory-bank/40-components/apex.templates.md` before applying family-specific item rules.
3. Start from `templates/items/items._index.md` and route to exactly one item family entrypoint.
4. Resolve visible item-template option IDs from the inventory in this file whenever `appearance.templateOptions` is present.
5. Use `itemName` as the canonical item identifier placeholder everywhere in `items/`.
6. Keep output variable-driven and remove fixed demo identifiers, page wrappers, and region names.
7. When Builder UI visibility conflicts with compiler-backed metadata, follow the compiler-valid property shape rather than assuming the Builder visibility state is authoritative.

---

# Variable Contract

| Name | Required | Type | Notes |
|---|---|---|---|
| itemName | yes | string | Page item static name such as `P10_STATUS`. |
| type | yes | enum | Family-specific item type token such as `textField`, `selectList`, or `displayOnly`. |
| label.* | conditional | variant | Label attributes when the family supports visible labels. |
| layout.* | yes | variant | Placement attributes such as `region`, `sequence`, `slot`, and alignment. When `layout.region` is present, `layout.slot` should usually be the host region slot such as `regionBody`, not a page-level slot like `body`. `layout.labelColumnSpan` is an optional deliberate override when label-grid width must be controlled explicitly. |
| appearance.* | conditional | variant | Template, template options, icon, size hints, placeholder text, and format masks when supported. |
| lov.* | conditional | variant | LOV source attributes for LOV-based item families. |
| settings.* | optional | variant | Family-specific settings emitted by the routed family template. |
| validation.* | optional | variant | Declarative validation attributes supported by the selected family. |
| source.* | conditional | variant | Binding and persistence attributes when the item is tied to a form or stored value. |
| help.helpText | required by default | string | Builder help text or assistive guidance for visible user-facing items; omit only for hidden items or a documented exemption. |
| security.* | optional | variant | Session state protection and authorization settings. |

---

# Output Skeleton Template

````apexlang
pageItem {{itemName}} (
    type: {{type}}
    label {
        label: {{label.label}}
        alignment: {{label.alignment}}
    }
    layout {
        sequence: {{layout.sequence}}
        region: @{{layout.region}}
        slot: {{layout.slot}}
        alignment: {{layout.alignment}}
        startNewRow: {{layout.startNewRow}}
    }
    appearance {
        template: {{appearance.template}}
        templateOptions: {{appearance.templateOptions}}
        icon: {{appearance.icon}}
        width: {{appearance.width}}
        height: {{appearance.height}}
        valuePlaceholder: {{appearance.valuePlaceholder}}
        formatMask: {{appearance.formatMask}}
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
    settings {
        {{settings.attributes}}
    }
    validation {
        valueRequired: {{validation.valueRequired}}
        minLength: {{validation.minLength}}
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
````

---

# Conditional Rendering Rules

- Omit blocks that are unsupported by the routed family or unnecessary for the requested scenario.
- Emit `layout.labelColumnSpan` only when a deliberate label-grid override is required. Use the canonical token `labelColumnSpan`; never emit the legacy alias `labelColSpan`.
- Choose exactly one LOV source when the family supports LOVs.
- For inline `lov.sqlQuery` definitions, return the display value first and the return value second.
- Canonical inline LOV SQL shape:
  ```sql
  select [displayValue],
         [returnValue]
    from ...
   where ...
   order by ...
  ```
- Emit `source {}` only for form-bound or persisted items.
- Keep `settings {}` reserved for family-specific attributes exposed by the routed family template and backed by compiler/export evidence.
- When `layout.region` is present, use the host region slot rather than a page-level slot. The default for items rendered inside a standard host region is usually `regionBody`, not `body` or `BODY`.
- Only apply validation.maxLength to text fields
- Emit `help { helpText: ... }` by default for visible editable, filter/control, and other user-facing items unless the item is hidden or a documented exemption applies.

---

# Guardrails

- Follow guardrails in `references/policies/memory-bank/00-guard/ai.guard.md`.
- Styling workflows do not own item-template defaults; only apply styling overrides when the request explicitly includes styling work and the item/template contract allows it.
- Do not invent unsupported attributes or UT classes.
- Use only the documented visible item-template option IDs: optional variants currently have no extra options, while required variants allow `asterisk` and `inline-label`.
- Keep `appearance.templateOptions` to exact accepted values only. `#DEFAULT#` is standalone when present; do not concatenate it with another token or swap in emitted CSS class strings.
- Keep placeholder names and block ordering consistent across the entire `items/` folder.
- Help text must follow the repo guidance layer: concise, useful, non-duplicative, and grounded in authoritative metadata when available; do not use placeholders or no-op copy.

---

# Folderization Rules

- Family template entrypoints are always `items/<family>/<family>._common.md` plus either `standard.md` or the routed variant file.
- Keep family folders in lowercase kebab-case.
- Keep scenario-specific output blocks in the family files and keep shared rules in the corresponding family common file.

---

# Theme 42 Visible Item Template Options

Use the listed `static_id` as the exact value to pass in the item's `templateOptions`.
Example: `templateOptions: [asterisk]`

## Hidden (`hidden`)

- none

## Optional (`optional`)

- none

## Optional - Above (`optional-above`)

- none

## Optional - Floating (`optional-floating`)

- none

## Required (`required`)

- Asterisk | `static_id=asterisk` | `css=t-Form-fieldContainer--indicatorAsterisk` | `group=Required Indicator`
- Inline Label | `static_id=inline-label` | `css=t-Form-fieldContainer--indicatorLabel` | `group=Required Indicator`

## Required - Above (`required-above`)

- Asterisk | `static_id=asterisk` | `css=t-Form-fieldContainer--indicatorAsterisk` | `group=Required Indicator`
- Inline Label | `static_id=inline-label` | `css=t-Form-fieldContainer--indicatorLabel` | `group=Required Indicator`

## Required - Floating (`required-floating`)

- Asterisk | `static_id=asterisk` | `css=t-Form-fieldContainer--indicatorAsterisk` | `group=Required Indicator`
- Inline Label | `static_id=inline-label` | `css=t-Form-fieldContainer--indicatorLabel` | `group=Required Indicator`
