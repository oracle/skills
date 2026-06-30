---
templateId: buttons.common
componentType: button
version: 1.0
description: Canonical shared contract for button templates.
---

# Purpose

Define the shared variable contract, guardrails, and base skeleton used by all button templates.

---

# Generation Rules (MANDATORY)

1. Load `references/policies/memory-bank/40-components/apex.buttons.md` before drafting buttons.
2. Validate action-specific requirements before rendering (`target`, `databaseAction`, `confirmation`, nested structures).
3. Use only server-side condition types from `references/policies/memory-bank/20-data/apex.logic.md`.
4. Resolve button template-option emitted values from the inventory in this file whenever `appearance.templateOptions` is present.
5. Do not invent CSS classes; keep button presentation within documented templates and template options.
6. Keep `layout.slot` valid for the referenced region template.
   For breadcrumb/header-region Create buttons, use the region's `CREATE` slot rather than the login/wizard `next` slot.
7. When `layout.column` or `layout.columnSpan` is used, validate them only within the button's local `layout.region + layout.slot` scope.
8. For `behavior.action: redirectThisApp`, render `behavior.target` as a declarative `target: { ... }` property object; do not emit scalar `f?p=...` URL strings.
9. When `appearance.buttonTemplate: @/text-with-icon` includes `appearance.icon`, include exactly one icon-position template option: default to `t-Button--iconLeft`, or use `t-Button--iconRight` only when explicitly requested.
10. Do not add `t-Button--iconLeft` or `t-Button--iconRight` to `appearance.buttonTemplate: @/icon`; icon-only buttons have no text side to position against.

---

# Variable Contract


| Name                          | Required    | Type         | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------- | ----------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| buttonStaticId                | yes         | string       | Static identifier used in `button <id> (...)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| buttonName                    | yes         | string       | Stable internal name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| label                         | yes         | string       | User-facing label.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| layout.sequence               | yes         | number       | Position in slot ordering.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| layout.region                 | yes         | alias        | Region static ID alias (for example `@FORM_REGION`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| layout.slot                   | yes         | enum         | Must be valid for parent region template.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| layout.column                 | optional    | number       | Local column position within the parent region + slot scope.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| layout.columnSpan             | optional    | number       | Local span within the parent region + slot scope; row total must stay within 12.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| appearance.buttonTemplate     | yes         | enum         | `@/text`, `@/text-with-icon`, `@/icon`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| appearance.templateOptions    | optional    | array/string | Include `#DEFAULT#` when present as its own entry and use only the variant-specific accepted emitted values documented in the inventory below. For `@/text-with-icon` with `appearance.icon`, include exactly one of `t-Button--iconLeft` or `t-Button--iconRight`, defaulting to left. Do not concatenate tokens or use aliases/static_ids.                                                                                                                                                                                                                                              |
| appearance.icon               | conditional | string       | Allowed only for `@/text-with-icon` or `@/icon`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| appearance.hot                | optional    | boolean      | Primary visual treatment; this is the DSL property used when the prompt asks for a primary button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| appearance.showAsDisabled     | optional    | boolean      | Render disabled state while keeping behavior explicit.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| behavior.action               | yes         | enum         | `submitPage`, `redirectThisApp`, `redirectOtherApp`, `definedByDynamicAction`, `triggerAction`, `menu`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| behavior.target               | conditional | object       | Required for redirect actions only. For `redirectThisApp`, use a declarative `target: { ... }` object with `page`, `items`, `clearCache`, `action`, and `request`; do not use scalar `f?p=...` strings.                                                                                                                                                                                                                                                                                                                                                                                           |
| behavior.target.page          | conditional | number       | If a same-app link is needed, set to the page ID of the target page.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| behavior.target.items         | conditional | object       | If a link is needed, set to a set of value-attribute pairs of page items and values they are to be set. Attributes can be in `&ITEM.` syntax if they represent a column or a literal. For example: items: { P1_ID: &P1_ID. P1_VAL: 100 }                                                                                                                                                                                                                                                                                                                                                         |
| behavior.target.clearCache    | conditional | string       | List of comma-separated page numbers; used to clear the session cache of each page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| behavior.target.action        | conditional | string       | Use when performing an additional action on the page. Valid values are:- `clearRegions` : Completely tears down all session settings and customizations (like filters, aggregates, and highlights), reverting the region to the absolute default state.- `resetRegions` : Reverts the region back to its last saved state (e.g., the default report settings) while often preserving pagination or specific saved report metadata.- `resetPagination` : resets the pagination for all reports on the target pageIn most cases, this will be either omitted entirely or set to `resetPagination` |
| behavior.target.request       | conditional | string       | Context of actions typically refers to the **Request Value** sent during a page submission to trigger specific server-side processes; often used to simulate pressing a button                                                                                                                                                                                                                                                                                                                                                                                                                     |
| behavior.databaseAction       | conditional | enum         | `insert`, `update`, `delete`; submit DML only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| behavior.requiresConfirmation | yes         | boolean      | If true, include `confirmation`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| behavior.warnOnUnsavedChanges | conditional | enum         | `doNotCheck` or `false`; omit for `definedByDynamicAction`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| confirmation.message          | conditional | string       | Required when `requiresConfirmation=true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| confirmation.style            | conditional | enum         | `danger`, `info`, `success`, `warning`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| serverSideCondition.type      | optional    | enum         | Use values from logic catalog only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| serverSideCondition.*         | conditional | varies       | Include only attributes required by selected condition type.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| security.authorizationScheme  | optional    | alias        | Must exist in app shared components.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |


---

# Base Skeleton

```apexlang
button {{buttonStaticId}} (
  buttonName: {{buttonName}}
  label: {{label}}
  layout {
    sequence: {{layout.sequence}}
    region: {{layout.region}}
    slot: {{layout.slot}}
  }
  appearance {
    buttonTemplate: {{appearance.buttonTemplate}}
    templateOptions: {{appearance.templateOptions}}
    icon: {{appearance.icon}}
    hot: {{appearance.hot}}
    showAsDisabled: {{appearance.showAsDisabled}}
  }
  behavior {
    action: {{behavior.action}}
    target: {
        page: {{behavior.target.page}}
        items: {
            {{behavior.target.items}}
        }
        clearCache: {{behavior.target.clearCache}}
        action: {{behavior.target.action}}
        request: {{behavior.target.request}}
    }
    databaseAction: {{behavior.databaseAction}}
    requiresConfirmation: {{behavior.requiresConfirmation}}
    warnOnUnsavedChanges: {{behavior.warnOnUnsavedChanges}}
  }
  confirmation {
    message: {{confirmation.message}}
    style: {{confirmation.style}}
  }
  serverSideCondition {
    type: {{serverSideCondition.type}}
  }
  security {
    authorizationScheme: {{security.authorizationScheme}}
  }
)
```

---

# Conditional Rendering Rules

- Always include: identity, layout, appearance.buttonTemplate, behavior.action, behavior.requiresConfirmation.
- `target` only when action is `redirectThisApp` or `redirectOtherApp`.
- `databaseAction` only when action is `submitPage` with DML intent.
- If `requiresConfirmation=true`, include `confirmation` with both `message` and `style`; otherwise omit it.
- Omit `warnOnUnsavedChanges` when action is `definedByDynamicAction`.
- Include `icon` only when template is icon-capable.
- If the template is `@/text-with-icon` and `icon` is present, include exactly one of `t-Button--iconLeft` or `t-Button--iconRight`; default to `t-Button--iconLeft`.
- If the template is `@/icon`, do not include left/right icon-position options.
- Render `serverSideCondition` and `security` only when explicitly required.
- If `behavior.action` = `redirectThisApp`, render a declarative `target: { ... }` object. Never render `target: f?p=...` for same-application redirects.

---

# Theme 42 Button Template Options

Use the listed emitted value as the exact value to pass in the button's `templateOptions`.
Do not pass caller-facing aliases/static_ids such as `push`, `left`, or `right`.
Example:
```apexlang
templateOptions: [
  #DEFAULT#
  t-Button--hoverIconPush
  t-Button--iconLeft
]
```

## Icon (`icon`)

- Push | emitted=`t-Button--hoverIconPush` | source id=`push` | group=Icon Hover Animation
- Spin | emitted=`t-Button--hoverIconSpin` | source id=`spin` | group=Icon Hover Animation

## Text (`text`)

- none

## Text with Icon (`text-with-icon`)

- Hide Icon on Desktop | emitted=`t-Button--desktopHideIcon` | source id=`hide-icon-on-desktop` | group=--
- Hide Label on Mobile | emitted=`t-Button--mobileHideLabel` | source id=`hide-label-on-mobile` | group=--
- Push | emitted=`t-Button--hoverIconPush` | source id=`push` | group=Icon Hover Animation
- Spin | emitted=`t-Button--hoverIconSpin` | source id=`spin` | group=Icon Hover Animation
- Left | emitted=`t-Button--iconLeft` | source id=`left` | group=Icon Position | default when `icon` is present
- Right | emitted=`t-Button--iconRight` | source id=`right` | group=Icon Position | explicit override only
