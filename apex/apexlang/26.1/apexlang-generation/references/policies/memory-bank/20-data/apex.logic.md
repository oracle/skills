# APEX Logic Standards

## 1. Essentials
- **Purpose:** Govern page-level Processes, Validations, and Dynamic Actions (DAs) for predictable, maintainable behavior.
- **Scope:** CRUD forms, reports, dashboards, utilities. Complements:
  - `30-pages/apex.form.md`, `30-pages/apex.page.md`
  - `20-data/apex.sql.md`

## Native Validation Selection Ladder (Non-Negotiable)
- Always choose the most declarative validation type first. Do not default to PL/SQL when a native validation can express the rule.
- Selection order:
  1. `itemIsNotNull` for prompts like “must have value”, “required”, “must be entered”.
  2. Declarative item or interactive-grid column checks (e.g., equals / list membership / no spaces / valid date).
  3. `expression` for boolean rules with binds only (status gates, numeric/date comparisons).
  4. `rowsReturned` / `noRowsReturned` for duplicate and existence checks.
  5. `functionBodyReturningErrorText` only when previous options cannot represent the requirement.
- Hard constraints:
  - Do not convert validation requirements into page processes.
  - “Prevent submission …” phrasing maps to validations, not processes.
  - “Native validation” in user prompts prohibits function-body fallback unless explicitly requested.
  - If more than one native validation is needed (for example required + greater than zero), emit separate validations instead of one PL/SQL block.

## Prompt Pattern Mapping (Validation Routing)
- Duplicate checks: “already exists”, “duplicate”, “same <col> and <col>” → SQL validation (`noRowsReturned`/`rowsReturned`) with bind variables.
- Required checks: “must have value”, “must be entered”, “cannot be blank/null” → `itemIsNotNull`.
- Required checks for interactive grid columns: “column must have value”, “row value is required” → `columnIsNotNull` with `editableRegion`.
- Date validity checks: “must be a valid date”, “invalid calendar date” → `itemIsAValidDate` or `columnIsAValidDate` for interactive grid columns.
- No spaces: “must not contain spaces” → declarative no-space validation (`itemContainsNoSpaces` or `columnContainsNoSpaces`) or regex expression when native option unavailable.
- Status gating: “prevent submission when status is X”, “must not remain Draft when approval” → expression validation with bind variables and optional button condition.
- Format enforcement: “follows format/pattern like CLM-2026-003” → regular expression validation (native regex/expression style), not function body.
  - `40-components/apex.items.md`
  - `10-global/apex.global.md`
- **Required inputs:** target page number, component identifiers (buttons, regions, items), table/view metadata for CRUD, triggering events for DAs.

## 2. Universal Guardrails
- Prefer declarative features before custom PL/SQL.
- Keep business logic in consolidated packages; pages orchestrate.
- Use templates only (`templates/**`); never copy content from `applications/**`.
- Enforce naming:
  - Processes `PROC_<purpose>` or `P<page>_PROC_<purpose>`
  - Validations `VAL_<target>_<rule>`
  - Dynamic actions `DA_<purpose>`
- SQL and PL/SQL must use named notation, and appear inside fenced blocks. Process-type policy split: page processes default to `invokeApi`, appProcess remains `executeCode`-only, and a thin page-level `executeCode` wrapper is allowed only for page-coupled loaders or branch-gated flows when direct page-item assignment is the reliable runtime-safe choice.
- Prefer declarative shapes over PL/SQL when the workflow can be expressed through supported native APEX DSL/process constructs.
- Hard limit: a PL/SQL text block longer than 4000 raw characters violates `PLSQL_INLINE_BLOCK_001`; extract it into a package API (`app_process_api` default) plus page-process `invokeApi` or a justified thin wrapper exception (`appProcess` stays `executeCode`). This finding blocks final output.
- Hard limit: an inline SQL block longer than 4000 raw characters violates `SQL_INLINE_BLOCK_001`; extract it into a secure view that the page artifact references instead of embedding the full query inline. This finding blocks final output.

## 3. Processes
- **Execution points:**
  - Before Header (init/session)
  - After Submit (primary DML)
  - On Demand (AJAX)
- Guard DML by button (`When Button Pressed`). Use `references/domains/business-logic/processes/workflow-page-processes-batch.md` to discover and identify how to replicate button-guarded invokeApi processes across pages.
- Use Automated Row Processing when possible; otherwise invoke packages: `pkg_entity.save(p_id => :Pxx_ID, ...)`.
- For form pages, emit exactly one `formAutoRowProcessing` per form region. Do not clone ARP processes by request or button for the same region source.
- When create/update/delete need different success messages on a single form region, set a transient page item (for example `P<page>_SUCCESS_MESSAGE`) in a lightweight pre-DML submit process based on `:REQUEST`, then reference that item from the single ARP `successMessage`.
- For application-level `appProcess`, use `type: executeCode` only; do not emit `type: invokeApi` in app-process artifacts.
- Modal dialogs: close on success and refresh calling page via DA (`dynamic-actions/da-refresh-region-after-dialog.apx`).
- Modal and drawer pages: `process ... type: closeDialog` must be the final post-submit process by execution sequence. Any placeholder preparation, native `sendEMail`, logging, notifications, audit writes, or other submit-time side effects must execute before `closeDialog`.
- Do not leave `closeDialog` at an inherited or preexisting sequence when new after-submit processes are added to a modal or drawer page. Resequence it explicitly so it is strictly last among submit-time processes on that page.
- Do not `COMMIT`; let APEX manage transactions. Clear transient session state when finished.

## 4. Validations
- Prefer declarative validations (NOT NULL, Regex, SQL EXISTS, etc.).
- Custom PL/SQL goes inside ```plsql``` fences with named notation.
- Messages: concise, user-friendly, and associated to items. Preserve placeholders and HTML.
- Scope execution when needed using `serverSideCondition { whenButtonPressed: @<button_alias> }`; aliases must reference buttons on the same page (do not reuse sample names like `@primary`).
- Apply authorization with `security { authorizationScheme: @<scheme> }` only when the scheme exists in shared components; omit the block otherwise. Default application scaffolds include schemes such as `@administration-rights`; replace with whichever scheme suits the page.

- Role-based authorization dependency: if the referenced authorization scheme enforces role membership, corresponding roles MUST be declared in `shared-components/acl-roles.apx` as `role <static-id> (...)` entries (see `ACL_ROLE_DECLARATION_REQUIRED_001`).
  - Compliant: authorization checks reference `claim-supervisor` and the roles artifact declares `claim-supervisor`.
  - Non-compliant: authorization checks reference `claim_supervisor` or undeclared role IDs.
- Canonical examples for every supported validation type examples: `templates/business-logic/validations/validations._index.md` and scenario files in the same directory.
- Variable catalog and gospel skeleton: `templates/business-logic/validations/validations._common.md`.
- All generated validations MUST follow the gospel skeleton below (add or remove attributes only inside the `validation {}` block as required by the validation type). Omit the entire `security {}` block when an authorization scheme is not supplied.

```
validation [validationStaticId] (
    name: [validationName]
    execution {
        sequence: [seq]
    }
    validation {
        plsqlExpression: [plsqlExpression]
    }
    error {
        errorMessage: [errorMessage]
        associatedItem: [associatedItem]
    }
    security {
        authorizationScheme: [authorizationScheme]
    }
)
```

- Replace placeholders as follows: `validationStaticId` uses the `VAL_<target>_<rule>` convention, `validationName` is the user-facing label, `sequence` is numeric, `plsqlExpression` (or the applicable validation attribute) captures the rule, `errorMessage` communicates the failure, and `associatedItem` points to the target item (e.g., `@P1_ITEM`).

## 5. Dynamic Actions
- **Trigger events:** Use only the approved `when.event` values documented in `templates/business-logic/dynamic-actions/dynamic-actions._common.md`.
- For dialog-close refresh behavior, use `apexafterclosedialog` for successful close flows and `apexafterclosecanceldialog` for cancel-close flows.
- Never invent shorthand aliases such as `dialogClosed`.
- **Conditions:** 
  - use `clientSideCondition`/`when` to avoid unnecessary execution.
  - use `serverSideCondition` when prompted by user. This is applicable to the dynamic action component or its specific action type. See `templates/business-logic/dynamic-actions/dynamic-actions._common.md` for reference.
- **Canonical templates** (`templates/business-logic/dynamic-actions/`):
  - Show/Hide: `da-show-hide-items.apx`
  - Enable/Disable: `da-enable-disable-items.apx`
  - Class & focus: `da-add-remove-class.apx`, `da-focus-highlight-region.apx`
  - Refresh: `da-refresh-region-on-change.apx`, `da-refresh-region-after-dialog.apx`, `da-refresh-region-after-api.apx`
  - Set Value: `da-set-value-sql.apx`, `da-set-value-plsql-function.apx`, `da-set-value-javascript-expression.apx`
  - AI assistant: `dynamic-actions.show-ai-assistant.md` (requires `genAI.agent` and a valid assistant target; see note below)
  - Server execution: `da-execute-server-side-code.apx`, `da-delete-with-notification.apx`
  - Alert/Confirm: `da-alert-confirm-cancel.apx`
  - Timer, slider, debounce/throttle, plugin styling: see dedicated templates
- Server-side work should be packaged and referenced via `invokeApi` by default; use a thin page-level `executeCode` wrapper only when the page must assign items directly in a runtime-safe loader or branch flow, and keep inline business logic out of that wrapper. Critique must hard-fail inline PL/SQL over 4000 raw characters under `PLSQL_INLINE_BLOCK_001`.
- Use specific `itemsToSubmit`; avoid broad lists.
- AI assistant settings note:
  - Prefer `genAI { agent: @AGENT }` referencing an existing AI agent alias (for example `@home`).
  - Resolve chatbot agent aliases from `/shared-components/ai-agents/`.
  - Do not mix this pattern with legacy `genAi { config: ... }` or inline `genAi { service: ... }` assistant launcher syntax.
  - Inline rendering is **opt-in only** (do not create chatbot UI by default). If explicitly requested, it requires `appearance.displayAs: inline` + `appearance.containerSelector` (example `#chat`) and a matching container element on the page (example: Static Content region with `advanced.htmlDomId: chat`).
- AI assistant (chatbot) does **not** require creating a dialog page or a custom chat UI:
  - Default implementation: Add a Breadcrumb/Title Bar button and a Dynamic Action on that button click using template `templates/business-logic/dynamic-actions/dynamic-actions.show-ai-assistant.md` with `genAI { agent: @AGENT }`.
  - Keep the launcher button on `behavior.action: definedByDynamicAction`; do not use `triggerAction` for this pattern.
  - Canonical references: `templates/business-logic/dynamic-actions/dynamic-actions.show-ai-assistant.md` and `templates/page-examples/chatbot-page/chatbot-page.example.md`.

### Dynamic Action Corrections

### CORRECTION_001: setValue Static Values
**Pattern**: setValue action with static type
**Incorrect**:
```apexlang
settings {
    type: static
    staticValue: VALUE_HERE
}
```
**Correct**:
```apexlang
settings {
    type: static
    value: VALUE_HERE
}
```
**Error**: `staticValue` property invalid for setValue actions
**Template**: `da-set-value-static.apx`
**Validation**: Must use `value` property for static values

### CORRECTION_002: Button warnOnUnsavedChanges
**Pattern**: Button with dynamic action behavior
**Incorrect**:
```apexlang
button button_name (
    behavior {
        action: definedByDynamicAction
        warnOnUnsavedChanges: doNotCheck
    }
)
```
**Correct**:
```apexlang
button button_name (
    behavior {
        action: definedByDynamicAction
    }
)
```
**Error**: `warnOnUnsavedChanges` invalid for buttons with `action: definedByDynamicAction`
**Validation**: Remove `warnOnUnsavedChanges` when `action: definedByDynamicAction`

### CORRECTION_003: Success Message API
**Pattern**: Success message display
**Incorrect**:
```apexlang
action execute_js (
    action: executeJsCode
    settings {
        jsCode: apex.message.showPageSuccess("Message");
    }
)
```
**Correct**:
```apexlang
action show_success (
    action: showSuccessMessage
    settings {
        message: Message text here
    }
)
```
**Error**: `apex.message.showPageSuccess()` usage instead of declarative action
**Template**: `da-show-success-message.apx`
**Validation**: Use `showSuccessMessage` action over `executeJsCode` with apex.message

### CORRECTION_004: setValue SQL Type
**Pattern**: setValue action using SQL source
**Incorrect**:
```apexlang
settings {
    setType: sqlStatement
    sqlQuery:
        ```sql
        select ...
        ```
}
```
**Correct**:
```apexlang
settings {
    type: sqlQuery
    sqlQuery:
        ```sql
        select ...
        ```
}
```
**Error**: `setType` and `sqlStatement` are invalid for setValue
**Validation**: Use `type: sqlQuery` for SQL-based setValue actions

### CORRECTION_005: JavaScript Action Naming
**Pattern**: Dynamic action executing JavaScript
**Incorrect**:
```apexlang
action run_js (
    action: executeJavaScriptCode
    settings {
        code:
            ```javascript
            // script
            ```
    }
)
```
**Correct**:
```apexlang
action run_js (
    action: executeJsCode
    settings {
        jsCode:
            ```javascript
            // script
            ```
    }
)
```
**Error**: Invalid action name and setting key for JS execution
**Validation**: Use `executeJsCode` with `settings.jsCode`

### CORRECTION_006: Dynamic Action Button Alias
**Pattern**: Dynamic action button selector
**Incorrect**:
```apexlang
when {
    event: click
    selectionType: button
    button: CANCEL-CLAIM
}
```
**Correct**:
```apexlang
when {
    event: click
    selectionType: button
    button: @cancel-claim
}
```
**Error**: Raw button name used instead of button alias
**Validation**: Use alias format `@button-static-id` for `selectionType: button`

### CORRECTION_007: Action Execution Defaults
**Pattern**: Dynamic action action execution defaults
**Incorrect**:
```apexlang
execution {
    sequence: 10
    event: @da-sample
    fireOnInit: true
}
```
**Correct**:
```apexlang
execution {
    sequence: 10
    fireOnInit: false
}
```
**Error**: action-level `execution.event` is ignored and `fireOnInit` is enabled by default
**Validation**: Do not emit action-level `execution.event`; default to `fireOnInit: false` and use `true` only when prompt explicitly requests initialization behavior

## Reference Data

### setValue Types
```yaml
static:
  property: value
  type: string
  description: Static text/string values
  example: "value: \"Your Text\""
sqlQuery:
  property: sqlQuery
  type: multiline_sql
  description: Database query results
  requires: itemsToSubmit
  example: "sqlQuery: ```sql\nselect col from table\n```"
javaScriptExpression:
  property: javaScriptExpression
  type: string
  description: JavaScript expressions
  example: "javaScriptExpression: \"this.triggeringElement.value\""
plsqlFunctionBody:
  property: plsqlFunctionBody
  type: multiline_plsql
  description: PL/SQL function results
  requires: itemsToSubmit
  example: "plsqlFunctionBody: ```plsql\ndeclare l_val varchar2(100); begin return 'result'; end;\n```"
```

### Button Behavior Attributes
```yaml
valid_attributes:
  - name: action
    values: [submitPage, redirectThisApp, redirectOtherApp, triggerAction, definedByDynamicAction, menu]
    description: Button action type
  - name: target
    type: string
    description: Page reference for redirect actions supported by the canonical button templates
  - name: requiresConfirmation
    type: boolean
    description: Show confirmation dialog
  - name: warnOnUnsavedChanges
    values: [doNotCheck, check]
    condition: "ONLY when action is redirectThisApp/redirectOtherApp"
    description: Warn about unsaved changes before redirect

invalid_attributes:
  - name: warnOnUnsavedChanges
    condition: "when action: definedByDynamicAction"
    error: Attribute not supported for dynamic action buttons
```

### Success Message Patterns
```yaml
preferred_action: showSuccessMessage
avoid_action: executeJsCode with apex.message.showPageSuccess
best_practices:
  - sequence: "Place after primary action"
  - language: "Clear, user-friendly"
  - context: "Include relevant identifiers (e.g., &ITEM. references)"
  - examples:
      - "Record saved successfully"
      - "Claim #&P61_ID. cancelled successfully"
      - "User &APP_USER. updated profile"
```

## Validation Rules

### Pattern Matching
- **Rule_001**: `settings { type: static }` must contain `value:` not `staticValue:`
- **Rule_002**: `behavior { action: definedByDynamicAction }` must not contain `warnOnUnsavedChanges` (mirrors BTN_RULE_001 in `assets/component-policies.json`)
- **Rule_003**: `apex.message.showPageSuccess` usage triggers correction to `showSuccessMessage`
- **Rule_004**: `setValue` must not use `setType` or `type: sqlStatement`; use `type: sqlQuery`
- **Rule_005**: JavaScript dynamic actions must use `action: executeJsCode` and `settings.jsCode`
- **Rule_006**: For `selectionType: button`, `when.button` must use alias format `@button-static-id`
- **Rule_007**: Dynamic action action execution must set `fireOnInit: false` by default unless explicitly requested
- **Rule_008**: Use `redirectOtherApp` to redirect to a page that lives in another appication (mirrors BTN_RULE_002 in `assets/component-policies.json`)

### Error Prevention
- **Pre_generation**: Check all setValue actions for correct type-specific properties
- **Pre_generation**: Validate button behavior attributes against action type
- **Post_generation**: Scan for apex.message API usage and suggest declarative alternatives

## Implementation Notes
- **Parser**: Use this document to validate dynamic action syntax before generation
- **Parser**: For button behavior compatibility, use `assets/component-policies.json` as the machine-readable source of truth.
- **Correction**: Apply automatic fixes for known error patterns
- **Templates**: Reference canonical templates for correct implementations
- **Maintenance**: Update this document when new error patterns are discovered


## 6. Batch Automation Hooks
- **Dynamic Actions:**
  - Single page: `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions.md`
  - Multi-page (batch): `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions-batch.md`
  - PL/SQL Execute API batches map to `da-execute-server-side-code.apx`
- **Translations:**
  - Single key: `references/domains/shared-components/workflow-translations.md`
  - Bundles/Component updates: `references/domains/shared-components/workflow-translations-batch.md`
- **Page processes (batch):** Templates under `processes/page-process-invoke-api.apx` and workflow `references/domains/business-logic/processes/workflow-page-processes-batch.md` apply invokeApi processes across pages.

## 7. Server-Side Condition Catalog
- Components that support `serverSideCondition {}` must use entries from this catalog.
- Required attributes:
  - `item` for item comparisons (`item=value`, etc.)
  - `value` for equality/inequality
  - `list` for item list membership (`itemIsInColonDelimitedList`, `itemIsNotInColonDelimitedList`)
  - `plsqlExpression`, `plsqlFunctionBody`, or `sqlQuery` when using those types (with ``` fences)
- Critique fails any unsupported type or missing attribute.
- Compatibility mode: for `itemIsInColonDelimitedList` and `itemIsNotInColonDelimitedList`, accept legacy `value` only when migrating older artifacts and normalize to `list` in revised output.
- Token normalization note:
  - Keep `request=Value` and `request!=Value` with capital `V` exactly as shown.
  - Keep `item=value` and `item!=value` with lowercase `value` exactly as shown.
  - Unsupported example: `type: item=Value`.

| Token | Resolves To | Required Attributes | Example |
| --- | --- | --- | --- |
| `ssc.feature.flagEnabled("KEY")` | `type: request=Value` | `value` (`FEATURE_KEY_ENABLED`) | `serverSideCondition { type: request=Value value: FEATURE_SALES_ENABLED // token: ssc.feature.flagEnabled("SALES") }` |
| `ssc.feature.flagDisabled("KEY")` | `type: request=Value` | `value` (`FEATURE_KEY_DISABLED`) | `serverSideCondition { type: request=Value value: FEATURE_SALES_DISABLED // token: ssc.feature.flagDisabled("SALES") }` |
| `ssc.request.matches("REQUEST")` | `type: request=Value` | `value` | `serverSideCondition { type: request=Value value: SAVE // token: ssc.request.matches("SAVE") }` |
| `ssc.request.notMatches("REQUEST")` | `type: request!=Value` | `value` | `serverSideCondition { type: request!=Value value: DELETE // token: ssc.request.notMatches("DELETE") }` |
| `ssc.request.contains("REQ1:REQ2")` | `type: requestIsContainedInValue` | `value` (colon list) | `serverSideCondition { type: requestIsContainedInValue value: SAVE:APPLY // token: ssc.request.contains("SAVE:APPLY") }` |
| `ssc.request.notContains("REQ1:REQ2")` | `type: requestIsNotContainedInValue` | `value` (colon list) | `serverSideCondition { type: requestIsNotContainedInValue value: DELETE:CANCEL // token: ssc.request.notContains("DELETE:CANCEL") }` |
| `ssc.item.equals("P1_STATUS","APPROVED")` | `type: item=value` | `item`, `value` | `serverSideCondition { type: item=value item: P1_STATUS value: APPROVED // token: ssc.item.equals("P1_STATUS","APPROVED") }` |
| `ssc.item.notEquals("P1_STATUS","CLOSED")` | `type: item!=value` | `item`, `value` | `serverSideCondition { type: item!=value item: P1_STATUS value: CLOSED // token: ssc.item.notEquals("P1_STATUS","CLOSED") }` |
| `ssc.item.isNull("P1_OPTIONAL")` | `type: itemIsNull` | `item` | `serverSideCondition { type: itemIsNull item: P1_OPTIONAL // token: ssc.item.isNull("P1_OPTIONAL") }` |
| `ssc.item.isNotNull("P1_REQUIRED")` | `type: itemIsNotNull` | `item` | `serverSideCondition { type: itemIsNotNull item: P1_REQUIRED // token: ssc.item.isNotNull("P1_REQUIRED") }` |
| `ssc.item.isZero("P1_QUANTITY")` | `type: itemIsZero` | `item` | `serverSideCondition { type: itemIsZero item: P1_QUANTITY // token: ssc.item.isZero("P1_QUANTITY") }` |
| `ssc.item.isNotZero("P1_QUANTITY")` | `type: itemIsNotZero` | `item` | `serverSideCondition { type: itemIsNotZero item: P1_QUANTITY // token: ssc.item.isNotZero("P1_QUANTITY") }` |
| `ssc.item.isNullOrZero("P1_QUANTITY")` | `type: itemIsNullOrZero` | `item` | `serverSideCondition { type: itemIsNullOrZero item: P1_QUANTITY // token: ssc.item.isNullOrZero("P1_QUANTITY") }` |
| `ssc.item.isNotNullAndNotZero("P1_QUANTITY")` | `type: itemIsNotNullAndNotZero` | `item` | `serverSideCondition { type: itemIsNotNullAndNotZero item: P1_QUANTITY // token: ssc.item.isNotNullAndNotZero("P1_QUANTITY") }` |
| `ssc.item.contains("P1_NOTES","APPROVED")` | `type: textIsContainedInItem` | `item`, `value` | `serverSideCondition { type: textIsContainedInItem item: P1_NOTES value: APPROVED // token: ssc.item.contains("P1_NOTES","APPROVED") }` |
| `ssc.item.inList("P1_STATUS","OPEN:CLOSED")` | `type: itemIsInColonDelimitedList` | `item`, `list` | `serverSideCondition { type: itemIsInColonDelimitedList item: P1_STATUS list: OPEN:CLOSED // token: ssc.item.inList("P1_STATUS","OPEN:CLOSED") }` |
| `ssc.item.notInList("P1_STATUS","HOLD:CANCEL")` | `type: itemIsNotInColonDelimitedList` | `item`, `list` | `serverSideCondition { type: itemIsNotInColonDelimitedList item: P1_STATUS list: HOLD:CANCEL // token: ssc.item.notInList("P1_STATUS","HOLD:CANCEL") }` |
| `ssc.item.numeric("P1_AMOUNT")` | `type: itemIsNumeric` | `item` | `serverSideCondition { type: itemIsNumeric item: P1_AMOUNT // token: ssc.item.numeric("P1_AMOUNT") }` |
| `ssc.item.notNumeric("P1_CODE")` | `type: itemIsNotNumeric` | `item` | `serverSideCondition { type: itemIsNotNumeric item: P1_CODE // token: ssc.item.notNumeric("P1_CODE") }` |
| `ssc.item.alphaNumeric("P1_CODE")` | `type: itemIsAlphanumeric` | `item` | `serverSideCondition { type: itemIsAlphanumeric item: P1_CODE // token: ssc.item.alphaNumeric("P1_CODE") }` |
| `ssc.item.containsNoSpaces("P1_USERNAME")` | `type: itemContainsNoSpaces` | `item` | `serverSideCondition { type: itemContainsNoSpaces item: P1_USERNAME // token: ssc.item.containsNoSpaces("P1_USERNAME") }` |
| `ssc.text.equals("Review","APPROVED")` | `type: text=value` | `value` | `serverSideCondition { type: text=value value: APPROVED // token: ssc.text.equals("Review","APPROVED") }` |
| `ssc.text.notEquals("Phase","CLOSED")` | `type: text!=value` | `value` | `serverSideCondition { type: text!=value value: CLOSED // token: ssc.text.notEquals("Phase","CLOSED") }` |
| `ssc.text.contains("SAVE:APPLY")` | `type: textIsContainedInValue` | `value` | `serverSideCondition { type: textIsContainedInValue value: SAVE:APPLY // token: ssc.text.contains("SAVE:APPLY") }` |
| `ssc.text.notContains("DELETE:CANCEL")` | `type: textIsNotContainedInValue` | `value` | `serverSideCondition { type: textIsNotContainedInValue value: DELETE:CANCEL // token: ssc.text.notContains("DELETE:CANCEL") }` |

## 8. PL/SQL Expression Guardrails for Server-Side Conditions
- Purpose: enforce safe, readable expressions evaluated as TRUE/FALSE during rendering or processing.
- Assumptions: expressions run in DB session, read session state via binds (e.g., :P10_STATUS), must be side-effect free (no DML/commit/external calls).
- Output contract when generating expressions:
  1. One-line explanation of intent.
  2. Single PL/SQL expression suitable for APEX.
  3. Optional one-sentence null/data-type note.
- Syntax rules:
  - Always use bind syntax (:PXX_ITEM).
  - Use boolean operators only (=, !=, <, >, IN, BETWEEN, LIKE, IS NULL/NOT NULL, EXISTS).
  - For `WHERE` comparisons on columns ending with `_static_id`, normalize with LOWER:
    - `lower(col_static_id) = lower(<value_or_bind>)`
    - `lower(col_static_id) != lower(<value_or_bind>)`
    - `lower(col_static_id) in ('lowercase','values')`
  - Handle nulls explicitly via NVL/COALESCE or IS NULL/NOT NULL checks.
  - Keep predicates simple; favor parentheses for AND/OR clarity.
- Security guardrails:
  - Use bind variables; avoid dynamic SQL unless explicitly approved.
  - Do not rely on SSC as authorization; prefer Authorization Schemes for access control.
- Fundamental, Approved Patterns (Subject to more complex blocks of PLSQL depending on user request):
  - Null-safe flag checks: `NVL(:P10_IS_ADMIN, 'N') = 'Y'`.
  - Equality/state checks: `:P10_STATUS = 'ACTIVE'`.
  - Numeric guards: `:P10_EMP_ID IS NOT NULL AND :P10_EMP_ID > 0`.
  - List membership: `:P10_STATUS IN ('NEW','PENDING','APPROVED')`.
  - Date windows with null checks: `:P10_START_DATE IS NOT NULL AND :P10_END_DATE IS NOT NULL AND :P10_START_DATE <= :P10_END_DATE`.
  - EXISTS with binds ensuring ownership: `EXISTS (SELECT 1 FROM orders o WHERE o.order_id = :P10_ORDER_ID AND o.created_by = :APP_USER)`.
- Anti-patterns (reject):
  - Missing colon on binds (e.g., `P10_STATUS = 'ACTIVE'`).
  - Dynamic SQL execution (EXECUTE IMMEDIATE ...) inside conditions.
  - Side effects (DML/commit).
  - Authorization by SSC (`:APP_USER IN (...)`).
  - Null-unsafe comparisons (`:P10_FLAG != 'Y'` without NVL).
  - Mixed types (`:P10_COUNT = '1'`).
- Checklist before returning an expression:
  - All item references bind with `:`.
  - Predicate evaluates to boolean and is side-effect free.
  - No dynamic SQL, no DML/commit, no external calls.
  - Null handling explicit.
  - Data types match (numbers vs numbers, dates vs dates).
  - Queries use EXISTS with bind variables when needed.
  - Logic remains readable with parentheses.
  - SSC not used as primary authorization mechanism.
- Reviewer cues: verify session state availability, consider Authorization Scheme or Build Option alternatives, ensure predicates stay index-friendly, and confirm sensitive items honor Session State Protection.

## 9. Item Computations — Batch Guardrails
- Purpose: govern SQL/PLSQL computations applied to page items across multiple pages when using the computation batch workflow.
- Scope: item-level computations only (application-level computations handled separately later).
- Supported computation types:
  - `sqlQuery`: single value returned via SQL.
  - `sqlQueryMultipleValues`: colon-delimited list or associative data (ensure consuming item supports multi-value output).
  - `expression`: PL/SQL expression returning a scalar.
  - `functionBody`: PL/SQL function body wrapped in ```plsql``` returning a scalar.
- Guardrails:
  - Use bind syntax for items (`:Pnn_ITEM`) and named notation when calling packaged APIs.
  - Function bodies must be free of side effects (no DML/commit); leverage packaged APIs when logic is complex.
  - Multi-value SQL must guarantee deterministic ordering (e.g., `ORDER BY` within `listagg`).
  - Set execution point explicitly (`beforeHeader`, `afterSubmit`, etc.) and align sequences across pages for readability.
  - When defaulting values that reference Text Messages or LOVs, ensure dependencies are loaded on each target page.
  - Document data types and null handling to avoid implicit conversions.
- Batch workflow expectations:
  - Inputs capture shared computation type, execution point, sequence, and logic body.
  - Per-target overrides (item names, sequences, optional conditions) must be explicit; Missing Inputs halts the batch.
  - Draft summaries list each target with item name, computation type, return data type, and sequence.
  - Change log records state (drafted/applied/reverted), shared logic hash, and target list.
- Review cues:
  - Ensure logic matches the item data type (character → character, number → number).
  - Check for guardrail violations (missing bind variables, dynamic SQL, side effects).
  - Confirm sequences don’t conflict with existing computations on target pages.
