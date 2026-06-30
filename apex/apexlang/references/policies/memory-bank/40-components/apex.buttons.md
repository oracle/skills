# APEX Buttons — Authoritative Attribute Guide

## Purpose
- Define how to set button attributes in APEXlang based on the canonical split templates under templates/buttons/.
- Provide conditional rules, placement, and compliance checks to keep generation deterministic and aligned with Memory Bank rules.

## Scope and Sources of Truth
- Button generation must load the relevant template from `templates/buttons/` or `template-components/` before drafting attributes.
- Template entrypoints:
  - `templates/buttons/buttons._common.md`
  - `templates/buttons/buttons._index.md`
  - Action-specific templates: `templates/buttons/buttons.*.md`
- Canonical behavior compatibility contract: assets/component-policies.json
- Guard and Global rules: references/policies/memory-bank/00-guard/ai.guard.md, references/policies/memory-bank/10-global/apex.global.md
- Template positions: references/policies/memory-bank/40-components/apex.templates.md
- Do not invent attributes or values; follow template examples and referenced Memory Bank rules.

## General Structure
Buttons are defined within page files as standalone components with layout, appearance, behavior, and optional blocks.

## Example skeleton
```
button STATIC_ID_OR_NAME (
  buttonName: BUTTON_NAME
  label: BUTTON_LABEL
  layout {
    sequence: 10
    region: @REGION_STATIC_ID
    slot: NEXT
  }
  appearance {
    buttonTemplate: @/text-with-icon
    templateOptions: [
      #DEFAULT#
      t-Button--noUI
      t-Button--iconLeft
      t-Button--gapRight
    ]
    icon: fa-ICON_CLASS_NAME
  }
  behavior {
    action: submitPage
    databaseAction: null
    requiresConfirmation: false
    warnOnUnsavedChanges: doNotCheck
  }
  confirmation {
    message: This can be any kind of plaintext value
    style: warning
  }
  serverSideCondition {
    type: itemIsNotNull
    item: PXX_ITEM_NAME
  }
  security {
    authorizationScheme: AUTH_SCHEME_NAME
  }
)
```

## Attribute Catalog and Allowed Values
1) Identity and Labels
- buttonName: required. Use an explicit, stable name (UPPER_SNAKE recommended to match examples).
- label: required. User-facing text.

2) layout block
- sequence: required. Numeric order within containing slot.
- region: required. Reference the region static ID using @REGION_STATIC_ID syntax.
- slot: required. Must use a valid Button Position for the chosen region template.
  - For Standard region template, allowed examples include: EDIT, COPY, PREVIOUS, NEXT, SORT_ORDER, REGION_BODY, CLOSE, HELP, DELETE, CHANGE, CREATE, RIGHT_OF_IR_SEARCH_BAR
  - For Interactive Report template, allowed examples include: PREVIOUS, NEXT, SORT_ORDER, REGION_BODY, RIGHT_OF_IR_SEARCH_BAR
  - See references/policies/memory-bank/40-components/apex.templates.md for authoritative positions per template. Do not invent new slot names.
- Do NOT use REGION_POSITION_01 directly for buttons; it is reserved for placing regions (for example, the Hero/Breadcrumb container). When a prompt says “breadcrumb” or “title bar”, resolve it to the actual region static ID occupying REGION_POSITION_01 (commonly the hero/breadcrumb region created by page templates, e.g., `@test-application`). Point layout.region to that component and keep slot: NEXT (or the documented title-bar slot).
- Buttons use a local 12-column grid inside their parent region and slot, grouped by `layout.region + layout.slot`.
- The total explicit `columnSpan` of sibling buttons in one row must not exceed 12 within that button scope.
- Do not add button spans to the parent region span; the button scope resets to 12 columns inside the parent region.
- For equal-width button rows in generated application artifacts, omit `column` / `columnSpan` and use `startNewRow: false` on second-and-later sibling buttons.
- AI assistant/chatbot launcher pattern (no dialog page and no custom chatbot UI required):
  - Default: Place a **Chat / AI Assistant** button in the Breadcrumb/Title Bar region (the region occupying `REGION_POSITION_01`) with `behavior.action: definedByDynamicAction`, and implement the click behavior as a Dynamic Action using template `templates/business-logic/dynamic-actions/dynamic-actions.show-ai-assistant.md` with `genAI { agent: @AGENT }`.
  - Use an existing AI agent alias (for example `@home`); do not invent agent names when the target agent is unknown.
  - Chatbot agent artifacts are stored under `/shared-components/ai-agents/`.
  - Keep the assistant launch behavior in a `dynamicAction` block; do not use button-level `triggerAction` for this pattern.

3) appearance block
- buttonTemplate: required. Allowed values: @/text-with-icon, @/text, @/icon
- Primary button requests in user prompts map to `hot: true` in the emitted DSL.
- templateOptions: optional. Array with #DEFAULT# and optional documented template-option tokens; do not invent classes.
- Keep `#DEFAULT#` as its own entry. Do not concatenate it with another token and do not substitute emitted CSS class strings for the documented accepted value.
- For `buttonTemplate: @/text-with-icon` with `icon` present, `templateOptions` must include exactly one icon-position option: default to `t-Button--iconLeft`, or use `t-Button--iconRight` only when explicitly requested.
- For `buttonTemplate: @/icon`, do not add `t-Button--iconLeft` or `t-Button--iconRight`; icon-only buttons have no text side to position against.
- icon: optional. Only valid when buttonTemplate is @/text-with-icon or @/icon. Value must be a valid icon class (e.g., fa-...).

4) behavior block
- action: required. Allowed values:
  - submitPage
  - redirectThisApp
  - redirectOtherApp
  - definedByDynamicAction
- target: required only when action is redirectThisApp or redirectOtherApp. For redirectThisApp, use a declarative target block with page/items/clearCache/action/request; do not use scalar f?p URL strings.
- databaseAction: optional; typically used with submitPage. Allowed values: insert, update, delete. Omit or set null when not applicable.
- requiresConfirmation: required. Boolean. Defaults to false in examples. If true, a confirmation block must be present.
- warnOnUnsavedChanges: allowed values: doNotCheck, false
- warnOnUnsavedChanges is action-conditional: allowed only for redirect actions and prohibited for `definedByDynamicAction` (see BTN_RULE_001 in assets/component-policies.json).

5) confirmation block
- Only include when behavior.requiresConfirmation is true.
- message: required. Plaintext message.
- style: required. Allowed values: danger, info, success, warning

6) serverSideCondition block (optional, situational)
- type: required when block present. Use only the values listed in references/policies/memory-bank/20-data/apex.logic.md (e.g., `itemIsNotNull`, `rowsReturned`, `request=Value`, `never`).
- Attribute requirements by type:
  - `item`: required for all `item*` predicates and `textIsContainedInItem`.
  - `value`: required for equality/containment predicates (e.g., `item=value`, `request=Value`, `text=value`).
  - `plsqlExpression`, `plsqlFunctionBody`, `sqlQuery`: required for `expression`, `functionBody`, `rowsReturned`/`noRowsReturned` respectively. Wrap the body in the correct fenced code block (` ```plsql ```, ` ```sql ```).
- Do not invent attributes; consult the syntax examples in references/policies/memory-bank/20-data/apex.logic.md when uncertain.

7) security block (optional)
- authorizationScheme: required when block present. Must be one of the authorization schemes defined in the application shared components. Do not invent scheme names.

## Conditional Rules and Validation

### Action/Target
- If action ∈ {redirectThisApp, redirectOtherApp} then target is required. If action ∈ {submitPage, definedByDynamicAction} then target must be omitted.
- If action = definedByDynamicAction then warnOnUnsavedChanges must be omitted (BTN_RULE_001).
- If `redirectAnotherApp` appears in generated output, correct it to `redirectOtherApp` and treat the original value as invalid.

### Database Action
- If action = submitPage and a DML semantic is intended, set databaseAction ∈ {insert, update, delete}. Otherwise omit or set null.
- If action ≠ submitPage then databaseAction must be omitted.

### Confirmation
- If requiresConfirmation = true then include confirmation block with message and style ∈ {danger, info, success, warning}.
- If requiresConfirmation = false then do not include confirmation block.

### Icon usage
- If buttonTemplate ∈ {@/text-with-icon, @/icon} then icon may be set.
- If buttonTemplate = @/text then icon must be omitted.
- If buttonTemplate = @/text-with-icon and `icon` is present, templateOptions must include exactly one of `t-Button--iconLeft` or `t-Button--iconRight`; use `t-Button--iconLeft` unless the prompt explicitly asks for right-side icon placement.
- If buttonTemplate = @/icon, omit icon-position template options.
- Button icons must be Font APEX `fa-*` classes only; do not use Material, JET, image, custom CSS, or alias icon values.

### Server-side condition
- Validate against the canonical catalog (references/policies/memory-bank/20-data/apex.logic.md).
- Ensure required attributes for the chosen type are present; omit attributes that are not supported.

### Template Options
- templateOptions array must include #DEFAULT# if you are appending options.
- Do not invent CSS classes. Keep button presentation within shared template and template-option defaults.
- Icon-plus-text buttons must use canonical emitted icon-position values: `t-Button--iconLeft` by default, or `t-Button--iconRight` by explicit request. Do not emit aliases/static_ids such as `left` or `right`.

### Placement and Block Ordering
- Place button at page scope, not inside region declarations, but reference its containing region via layout.region.
- Recommended block order for readability (not syntactically enforced by examples): layout → appearance → behavior → confirmation → serverSideCondition → security
- confirmation must be a sibling of behavior and only present when requiresConfirmation is true.

## Modal Dialog Patterns (Submit/Close)
- Save/Create/Delete in modal dialogs:
  - behavior.action: submitPage
  - behavior.databaseAction: insert | update | delete
  - Do not set a target for submitPage; close the dialog in the After Submit process (see 20-data/apex.logic.md).
  - The calling page should refresh its report/region via a Dynamic Action; use /templates/business-logic/dynamic-actions/dynamic-actions.refresh-region-after-dialog.md.
- Cancel in modal dialogs:
  - behavior.action: definedByDynamicAction
  - Provide a Dynamic Action that closes the dialog; no databaseAction.
- Always guard After Submit processes with “When Button Pressed = [BUTTON_NAME]”.

## Examples
### A) Submit with confirmation (warning)
```
button SAVE_CONFIRM (
  buttonName: SAVE_CONFIRM
  label: Save
  layout {
    sequence: 20
    region: @FORM_REGION
    slot: NEXT
  }
  appearance {
    buttonTemplate: @/text
    templateOptions: #DEFAULT#
  }
  behavior {
    action: submitPage
    databaseAction: update
    requiresConfirmation: true
    warnOnUnsavedChanges: doNotCheck
  }
  confirmation {
    message: Please confirm you want to save changes
    style: warning
  }
)
```

### B) Redirect to this app (target required)
```
button GO_TO_REPORT (
  buttonName: GO_TO_REPORT
  label: View Report
  layout {
    sequence: 10
    region: @HEADER_REGION
    slot: NEXT
  }
  appearance {
    buttonTemplate: @/text-with-icon
    templateOptions: [
      #DEFAULT#
      t-Button--iconLeft
    ]
    icon: fa-arrow-right
  }
  behavior {
    action: redirectThisApp
    target {
      page: 2
      clearCache: 2
      request: RESET
      action: resetPagination
    }
    requiresConfirmation: false
    warnOnUnsavedChanges: doNotCheck
  }
)
```

### C) Delete with confirmation (danger) and server-side condition
```
button DELETE_ROW (
  buttonName: DELETE_ROW
  label: Delete
  layout {
    sequence: 30
    region: @FORM_REGION
    slot: DELETE
  }
  appearance {
    buttonTemplate: @/text
    templateOptions: #DEFAULT#
  }
  behavior {
    action: submitPage
    databaseAction: delete
    requiresConfirmation: true
    warnOnUnsavedChanges: doNotCheck
  }
  confirmation {
    message: This action cannot be undone. Proceed to delete?
    style: danger
  }
  serverSideCondition {
    type: itemIsNotNull
    item: PXX_PK_ITEM
  }
)
```

### D) Modal dialog Save + Cancel (close dialog, caller refresh)
```
button SAVE_MODAL (
  buttonName: SAVE_MODAL
  label: Save
  layout {
    sequence: 20
    region: @FORM_REGION
    slot: NEXT
  }
  appearance {
    buttonTemplate: @/text
    templateOptions: #DEFAULT#
  }
  behavior {
    action: submitPage
    databaseAction: update
    requiresConfirmation: false
    warnOnUnsavedChanges: doNotCheck
  }
)
```

- After Submit: Close the dialog on success (handled in page processes; see 20-data/apex.logic.md).  
- Calling page: Add DA from /templates/business-logic/dynamic-actions/dynamic-actions.refresh-region-after-dialog.md to refresh the source report after dialog close.

```
button CANCEL_MODAL (
  buttonName: CANCEL_MODAL
  label: Cancel
  layout {
    sequence: 10
    region: @FORM_REGION
    slot: PREVIOUS
  }
  appearance {
    buttonTemplate: @/text
    templateOptions: #DEFAULT#
  }
  behavior {
    action: definedByDynamicAction
    requiresConfirmation: false
  }
)
```

- Provide a Dynamic Action on this button to close the dialog (no databaseAction; no target).  
- Processes on the modal page must be guarded by “When Button Pressed = SAVE_MODAL” or equivalent.

## Breadcrumb/Title Bar Co-location Constraint
- When a page contains a breadcrumb region (type: breadcrumb), do not generate a standalone Buttons container region (e.g., a staticContent region using @/buttons-container) in the breadcrumb/title bar area or immediately after the breadcrumb in the same slot/area.
- Preferred pattern: Add page-level action button(s) associated to the breadcrumb/title bar by referencing the breadcrumb region in layout.region (e.g., layout.region: @breadcrumb) and using a title-bar slot defined by the template positions (e.g., slot: NEXT). See references/policies/memory-bank/40-components/apex.templates.md for valid positions.
- Rationale: Keep the title/breadcrumb bar uncluttered, avoid redundant containers; single primary actions belong next to the title.
- Scope: Always apply. This constraint is strict for the PL/SQL Maintenance and Support workflow; other flows should follow the same guidance unless a template explicitly requires a separate container.

## Compliance Checklist (for AI tooling)
- Do not invent attributes or values; use only those listed above and those in the template and Memory Bank.
- Validate action-target pairing:
  - redirect* → target required
  - redirectThisApp → declarative target block required; no scalar f?p string
  - submitPage/definedByDynamicAction → target omitted
- If submitPage and DML semantics apply → set databaseAction ∈ {insert, update, delete}; otherwise omit.
- requiresConfirmation true → add confirmation block with message + style ∈ {danger, info, success, warning}; requiresConfirmation false → no confirmation block.
- buttonTemplate dictates icon usage: only set icon for @/text-with-icon or @/icon.
- Slot must match a valid Button Position for the chosen region template; cross-check apex.templates.md.
- templateOptions: include #DEFAULT#; use only documented UT classes when styling is requested.
- For buttonTemplate = @/text-with-icon with icon present → templateOptions must include exactly one of `t-Button--iconLeft` or `t-Button--iconRight`; default to `t-Button--iconLeft`.
- For buttonTemplate = @/icon → do not emit `t-Button--iconLeft` or `t-Button--iconRight`.

- serverSideCondition:
  - type ∈ {itemIsNotNull, itemIsNull} → item required
  - type = never → item omitted
- security.authorizationScheme must reference an existing scheme in shared components.
- Write buttons in page files; do not modify the button template for instance-level configuration.

Notes
- This document codifies behavior from the split button templates under templates/buttons/ and complements template position guidance in apex.templates.md.
- If future template updates introduce new attributes or options, update this file accordingly and keep the Compliance Checklist synchronized.


## Additional Variants
- triggerAction buttons can chain nested actions (download, execute PL/SQL, etc.). Provide itemsToSubmit/itemsToReturn and ensure PL/SQL is side-effect free or routed via packaged APIs.
- menu buttons expose child entries; each entry has independent layout/behavior/appearance blocks (redirect, triggerAction).
- Disabled states: set appearance.showAsDisabled: true; retain behavior definition for accessibility/consistency.

## Batch Automation
- Use `references/domains/business-logic/processes/workflow-page-processes-batch.md` for invokeApi page processes when guarding by button.
- Future workflow: button action batch (submit vs redirect vs menu) — see plan for implementation.
