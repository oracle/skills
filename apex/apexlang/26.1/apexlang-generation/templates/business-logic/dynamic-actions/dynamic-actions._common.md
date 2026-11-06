---
templateId: dynamic-actions.common
componentType: dynamicAction
version: 2.0
imports:
  - dynamic-actions._common
description: Shared canonical contract for dynamic action templates, including submit/cancel/close dialog lifecycles.
---

# Purpose

Standardize dynamic action generation with deterministic field contracts, action capability rules, and lifecycle-safe dialog patterns aligned with `references/policies/memory-bank/20-data/apex.logic.md`.

---

# Generation Rules (MANDATORY)

1. Load `references/policies/memory-bank/20-data/apex.logic.md` before drafting dynamic actions.
2. Use only documented action names and properties. Do not invent aliases, keys, or ad-hoc settings.
3. Use button aliases in DA triggers (`@button-static-id`) and component aliases for regions/actions.
4. Default every action execution block to `fireOnInit: false` unless explicitly requested.
5. Keep client-side behavior in dynamic actions; keep post-submit dialog closure in processes (`type: closeDialog`) unless explicit client-only closure is requested.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| dynamicActionStaticId | yes | string | Static identifier (`DA_<purpose>`). |
| name | yes | string | Descriptive name shown in the builder. |
| execution.sequence | yes | number | Execution order on the page. |
| when.event | yes | enum | Triggering event. Must be one of the approved event values listed below; never invent aliases such as `dialogClosed`. |
| when.selectionType | yes | enum | Trigger scope (`button`, `region`, `items`, `jQuerySelector`, `eventSource`, `javascriptExpression`). |
| when.button | conditional | alias | Required when `selectionType: button`; always `@...` alias format. |
| when.items/item | conditional | string | Required when `selectionType` targets items/item. |
| when.region | conditional | alias | Required when `selectionType: region`. |
| clientSideCondition.* | optional | condition | Declarative client-side gating. |
| serverSideCondition.* | optional | condition | Declarative server-side gating. |
| security.authZScheme | optional | string | Authorization scheme alias. |
| action.name | yes | string | Unique action identifier. |
| action.action | yes | enum | Action type (`refresh`, `setValue`, `executeServerSideCode`, etc.). |
| action.execution.sequence | yes | number | Order relative to other actions. |
| action.execution.event | no | n/a | Do not emit; current APEXlang compilers ignore action-level `execution.event`. |
| action.execution.fireOnInit | optional | boolean | Default is `false`; set `true` only when explicitly requested. |
| action.execution.fireWhenEventResultIs | optional | enum | Use for explicit true/false branches after `confirm` actions. |
| affectedElements.selectionType | conditional | enum | Target for the action (`region`, `items`, `triggeringElement`, `jquerySelector`, `javaScriptExpression`). |
| affectedElements.* | conditional | string | References for the selected target. |
| settings.type | optional | enum | For `setValue`, allowed values are `static`, `sqlQuery`, `plsqlFunctionBody`, `javaScriptExpression`. |
| settings.requestButtonName | conditional | string | Required when `action.action = submitPage`; submit request alias (for example `DELETE`). |
| settings.* | conditional | variant | Action-specific settings (`class`, `itemsToSubmit`, `value`, `sqlQuery`, `plsqlFunctionBody`, etc.). |
| action.serverSideCondition.* | optional | condition | Server-side gating for the action. |
| action.security.authZScheme | optional | string | Authorization scheme alias for the action. |

---

# Approved `when.event` Values

Use only these values for `when.event`:

```text
apexafterclosecanceldialog
apexafterclosedialog
apexafterrefresh
apexbeforepagesubmit
apexbeforerefresh
apexdoubletap
apexpan
apexpress
apexselectionchange
apexswipe
apextap
change
click
custom
dblclick
focusin
focusout
input
item/geocodedAddress/apexgeocoderresponse
item/geocodedAddress/apexgeocoderselection
item/markdownEditor/markdownified
item/shuttle/shuttlechangeorder
keydown
keypress
keyup
load
mousedown
mouseenter
mouseleave
mousemove
mouseup
ready
region/calendar/apexcalendardateselect
region/calendar/apexcalendareventselect
region/calendar/apexcalendarviewchange
region/cards/tablemodelviewpagechange
region/facetedSearch/facetsafterremovechart
region/facetedSearch/facetsbeforeaddchart
region/facetedSearch/facetschange
region/interactiveGrid/apexbeginrecordedit
region/interactiveGrid/gridpagechange
region/interactiveGrid/interactivegridmodechange
region/interactiveGrid/interactivegridreportchange
region/interactiveGrid/interactivegridsave
region/interactiveGrid/interactivegridselectionchange
region/interactiveGrid/interactivegridviewchange
region/map/spatialmapchanged
region/map/spatialmapclick
region/map/spatialmapinitialized
region/map/spatialmapobjectclick
region/smartFilters/facetschange
region/tree/treeviewselectionchange
resize
scroll
select
unload
```

Dialog lifecycle mapping:
- Use `apexafterclosedialog` after successful dialog close flows.
- Use `apexafterclosecanceldialog` after cancel-close flows.
- Do not emit aliases such as `dialogClosed`.
- Prefer page-ready behavior through `when.event: ready`.
- Do not combine `when.event: ready` with `action.execution.fireOnInit`; choose one initialization mechanism, not both.

---

# Action Capability Matrix

| Action Value | Notes |
|--------------|-------|
| addClass / removeClass | Declarative class manipulation. |
| show / hide | Toggle visibility of targets. |
| refresh | Refresh region or component. Valid only in DA `action (...)`; Settings required: ``affectedElements`; commonly chained after `apexafterclosedialog` or `apexafterclosecanceldialog` depending on the dialog lifecycle. |
| submitPage | Submit page declaratively; use `settings.requestButtonName` for the request value. |
| cancelDialog | Client-side dialog cancel; no submit/DML by default. Valid in DA `action (...)` and Button `triggerAction (...)` |
| closeDialog | Client close intent; for post-submit closure prefer process `type: closeDialog`. Valid in DA `action (...)` (specialized) and Button `triggerAction (...)` (specialized) |
| setValue | Populate items; must use `settings.type` and matching payload key (`value`, `sqlQuery`, `plsqlFunctionBody`, `javaScriptExpression`). |
| enable / disable | Enable or disable items declaratively. |
| confirm | yes | yes | `settings.message` | Pair with true/false branch actions as needed. |
| showSuccessMessage / showErrorMessage | Display inline notifications. Valid in DA `action (...)` and Button `triggerAction (...)`; Settings required:`settings.message` |
| executeJsCode | Execute JavaScript code; use `settings.jsCode`. |
| executeServerSideCode | Execute PL/SQL (prefer invokeApi for packaged logic). Keep logic thin; package APIs preferred via process invokeApi. Valid in DA `action (...)` and Button `triggerAction (...)`; Settings required: `settings.plsqlCode` |
| invokeServerSideEvent | Invoke server-side events. |
| dialog | Open/close dialogs (openDialog, closeDialog). |
| navigate | Perform navigation actions. |
| timer | Timer-based actions (start/stop). |
| custom | Reserved for plugin/custom actions—use with caution. |

# Dialog Lifecycle Patterns (Authoritative)

1. Cancel flow
   - Trigger: cancel button click.
   - Action: `cancelDialog`.
   - Outcome: closes/cancels dialog interaction without submit.

2. Submit flow
   - Trigger: click/change/other event.
   - Action: `submitPage`.
   - Outcome: submit-bound validations/processes execute.

3. Close-after-submit flow
   - Primary closure point: server-side `process ... type: closeDialog`.
   - Guard with button/request conditions (for example `CREATE,SAVE,DELETE`).
   - Use DA-based close only when explicitly requested as client behavior.

---

# Output Template – Full

```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: {{when.event}}
        selectionType: {{when.selectionType}}
        button: @{{when.button}}
        items: {{when.item}}
        region: @{{when.region}}
        jquerySelector: {{when.jQuerySelector}}
    }
    clientSideCondition {
        type: {{clientSideCondition.type}}
        item: {{clientSideCondition.item}}
        value: {{clientSideCondition.value}}
    }
    serverSideCondition {
        type: {{serverSideCondition.type}}
        item: {{serverSideCondition.item}}
        {{serverSideCondition.comparisonAttribute}}: {{serverSideCondition.comparisonValue}}
    }
    action {{action.name}} (
        action: {{action.action}}
        affectedElements {
            selectionType: {{affectedElements.selectionType}}
            region: @{{affectedElements.region}}
            items: {{affectedElements.item}}
            jquerySelector: {{affectedElements.jQuerySelector}}
            javaScriptExpression: {{affectedElements.javaScriptExpression}}
        }
        settings {
            type: {{settings.type}}
            value: {{settings.value}}
            message: {{settings.message}}
            title: {{settings.title}}
            itemsToSubmit: {{settings.itemsToSubmit}}
            requestButtonName: {{settings.requestButtonName}}
            itemsToReturn: {{settings.itemsToReturn}}
            class: {{settings.class}}
            sqlQuery:
                ```sql
                {{settings.sqlQuery}}
                ```
            plsqlFunctionBody:
                ```plsql
                {{settings.plsqlFunctionBody}}
                ```
            plsqlCode:
                ```plsql
                {{settings.plsqlCode}}
                ```
            javaScriptExpression: {{settings.javaScriptExpression}}
            jsCode:
                ```javascript
                {{settings.jsCode}}
                ```
            javaScriptExpression: {{settings.javaScriptExpression}}
        }
        execution {
            sequence: {{action.execution.sequence}}
            fireOnInit: false
            fireWhenEventResultIs: {{action.execution.fireWhenEventResultIs}}
        }
        serverSideCondition {
            type: {{action.serverSideCondition.type}}
            item: {{action.serverSideCondition.item}}
            {{action.serverSideCondition.comparisonAttribute}}: {{action.serverSideCondition.comparisonValue}}
        }
        security {
            authorizationScheme: @{{action.security.authZScheme}}
        }
    )
)
```

---

# Conditional Rendering Rules

- Remove optional blocks (`clientSideCondition`, `serverSideCondition`, `security`) when not needed.
- Render only fields compatible with selected `when.selectionType` or `affectedElements.selectionType`.
- For `setValue`, use `settings.type` values only: `static`, `sqlQuery`, `plsqlFunctionBody`, `javaScriptExpression`.
- Use `settings.jsCode` for `executeJsCode`; never use `settings.code`.
- Do not emit action-level `execution.event`; the action inherits the parent dynamic action trigger.
- Provide only the `affectedElements` fields relevant to the selection type.
- Include action-specific settings required by the selected action (`type`, `value`, `itemsToSubmit`, etc.).
- Condition `type` tokens are case-sensitive and must match the catalog in `references/policies/memory-bank/20-data/apex.logic.md` exactly.
- Set `comparisonAttribute` to `list` for `itemIsInColonDelimitedList` / `itemIsNotInColonDelimitedList`; otherwise use `value`.
  - Valid: `item=value`, `item!=value`
  - Invalid: `item=Value`, `item!=Value`
- For `action: submitPage`, use `settings.requestButtonName`.
- Use `fireWhenEventResultIs` only when modelling false-action fallbacks (e.g., Cancel branch).
- Do not combine `when.event: ready` with `action.execution.fireOnInit`; choose one initialization mechanism.
- When a `clientSideCondition` is present for branch-style behavior, model both outcomes in the same dynamic action:
  - `True` branch action(s): default execution path.
  - `False` branch action(s): same DA, with `execution.fireWhenEventResultIs: false`.
- Prefer one DA with true/false actions over two separate DAs for inverse outcomes (for example `disable`/`enable`, `show`/`hide`).
- If the false branch is intentionally omitted, scenario template must explicitly document why.
- Do not use `setType` or `type: sqlStatement` for `setValue`.
- Do not use `action: executeJavaScriptCode` or `settings { code: ... }`; use `action: executeJsCode` with `settings { jsCode: ... }`.
- For `selectionType: button`, always use `when.button` as `@button-static-id` alias format.
- Set `fireOnInit: false` by default on every action execution block; only use `true` when explicitly requested.

# Validation Checklist

- Trigger alias is valid (`@...`) for button/region references.
- Action name is supported in matrix and has matching settings.
- `fireOnInit` explicitly false unless caller requested otherwise.
- Dialog workflows use the correct lifecycle split:
  - `cancelDialog` for cancel interaction.
  - `submitPage` for submission.
  - Process `type: closeDialog` for post-submit close.
