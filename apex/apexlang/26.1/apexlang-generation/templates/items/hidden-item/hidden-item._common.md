---
templateId: items.hidden.common
componentType: item
version: 2.0
canonicalDslType: hidden
nativeType: NATIVE_HIDDEN
description: Canonical contract for hidden-item item templates.
---

# Purpose

Define the canonical contract, conditional rules, and output skeleton for `hidden-item` items.

---

# Generation Rules (MANDATORY)

1. Load `templates/items/items._common.md` first.
2. Load `references/policies/memory-bank/40-components/apex.items.md` before drafting final item DSL.
3. Use this family only for `hidden` semantics and remove attributes that belong to other item families.
4. Keep scenario overlays in the family templates and keep reusable contract details in this common file.

---

# Variable Contract

| Name | Required | Type | Notes |
|---|---|---|---|
| itemName | yes | string | Page item static name such as `P10_STATUS`. |
| type | yes | enum | Must be `hidden`. |
| layout.region | yes | alias | Host region static ID reference. |
| layout.sequence | yes | number | Rendering sequence within the region. |
| layout.slot | optional | enum | Region slot, typically `regionBody` for items rendered inside a host region. |
| layout.alignment | optional | enum | Item alignment inside the slot. |
| settings.* | optional | variant | Normalized family settings such as `valueProtected`. |
| source.formRegion | conditional | alias | Required for form-bound items. |
| source.column | conditional | string | Target column for form-bound items. |
| source.dataType | conditional | enum | Data type for DML binding. |
| security.sessionStateProtection | required | enum | Default `checksumRequiredSessionLevel`; use `unrestricted` for documented same-page client-side-owned hidden state that is mutated after render by dynamic actions, `itemsToReturn`, `setValue`, or initialization JavaScript. |
| security.authorizationScheme | optional | alias | Authorization scheme alias when the item is conditionally visible. |

---

# Output Skeleton Template

```apexlang
pageItem {{itemName}} (
    type: hidden
    layout {
        sequence: {{layout.sequence}}
        region: @{{layout.region}}
        slot: {{layout.slot}}
    }
    settings {
        valueProtected: {{settings.valueProtected}}
    }
    source {
        formRegion: @{{source.formRegion}}
        column: {{source.column}}
        dataType: {{source.dataType}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
        authorizationScheme: @{{security.authorizationScheme}}
    }
)
```

---

# Conditional Rendering Rules

- Hidden and ID-style items default to `sessionStateProtection: checksumRequiredSessionLevel`.
- Classify each hidden item before emitting it:
  - Protected hidden data: set only on initial render or normal submit processing; keep `sessionStateProtection: checksumRequiredSessionLevel`.
  - Client-owned hidden UI state: changed after render by dynamic actions, `itemsToReturn`, `setValue`, or initialization JavaScript; use `sessionStateProtection: unrestricted`.
- If a hidden item is intentionally changed by same-page client-side code during show processing, Ajax refresh, `itemsToReturn`, `setValue`, or initialization, switch it to `sessionStateProtection: unrestricted` or APEX can raise `ORA-20987` when it tries to save the new value without a session checksum.
- If `sessionStateProtection: unrestricted` is used, emit comments explaining the same-page client-side owner of the value and why checksum protection would block the intended flow.
- Use this canonical rationale shape for unrestricted hidden items:
  - `Same-page dynamic-action ownership: this hidden item is updated after render via itemsToReturn or setValue and is used only as UI state, so checksum-based SSP would block the intended flow.`
- If a hidden item appears in dynamic-action `itemsToReturn` or as a `setValue` target, treat that as a hard signal that the item is client-owned post-render state rather than protected hidden data.
- Remove unsupported or unused blocks before finalizing the DSL.
- Omit `source {}` when the item is not bound to persisted data or a form region.
- Emit native hidden-item `settings {}` properties only when compiler/export evidence proves the specific plugin attributes; absence from the generic page-item grammar is not a rejection.

---

# Guardrails

- Follow guardrails in `references/policies/memory-bank/00-guard/ai.guard.md`.
- Do not invent unsupported attributes or UT classes.
- Keep placeholder names aligned with `templates/items/items._common.md`.
- Keep the generated item aligned with the target column type and the intended user interaction.
