---
templateId: validations.common
componentType: validation
version: 1.0
description: Canonical validation schema for all page validations.
---

# Purpose

Define the shared variable contract, guardrails, and skeleton used by all validation templates.

---

# Generation Rules (MANDATORY)

1. Load `references/policies/memory-bank/20-data/apex.logic.md` before drafting validations.
2. Populate required variables from this contract; scenario files may only specialize optional sections.
3. Wrap SQL/PLSQL bodies in triple backticks and keep them idempotent.
4. Treat validations as the default home for user-correctable submit errors; only leave a rule in page-process PL/SQL when it cannot be safely pre-validated before DML.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| validationStaticId | yes | string | Static identifier (`VAL_<target>_<rule>`). |
| validationName | yes | string | User-facing validation name. |
| execution.sequence | yes | number | Execution order. |
| validation.type | yes | string | Type of validation; valid values include `functionBody`, `functionBodyReturningBoolean`, `expression`, `itemIsNotNull`, `itemIsNotNullOrZero`, `itemIsNotZero`, `itemIsNumeric`, `itemIsAlphanumeric`, `itemContainsNoSpaces`, `itemIsAValidDate`, `itemIsAValidTimestamp`, `item=Value`, `item!=Value`, `itemIsContainedInValue`, `itemIsNotContainedInValue`, `itemContainsAtLeastOneOfCharsInValue`, `itemContainsOnlyCharsInValue`, `itemContainsNoneOfCharsInValue`, `itemMatchesRegexp`, `columnIsNotNull`, `columnIsNotNullOrZero`, `columnIsNotZero`, `columnIsNumeric`, `columnIsAlphanumeric`, `columnContainsNoSpaces`, `columnIsAValidDate`, `columnIsAValidTimestamp`, `noRowsReturned`, `rowsReturned`, `plsqlError` |
| validation.language | optional | enum | Use `sql` when supplying `sqlExpression`. |
| validation.plsqlExpression | conditional | plsql | Required for `type: expression`. |
| validation.plsqlFunctionBody | conditional | plsql | Required for `type: functionBody` (return `NULL` on success). |
| validation.plsqlFunctionBodyReturningBoolean | conditional | plsql | Required for boolean-returning function bodies. |
| validation.sqlQuery | conditional | sql | Required for SQL-based validations (`noRowsReturned`, etc.). |
| validation.sqlExpression | conditional | sql | Required when `language: sql`. |
| validation.item | conditional | string | Required for item-based validations (including `itemIsAValidDate`). |
| validation.editableRegion | conditional | string | Required for interactive grid validations; references the editable IG region static ID. |
| validation.column | conditional | string | Required for declarative interactive grid column validations. |
| validation.value | conditional | string | Required for list/comparison checks; omit for item-only checks such as `itemIsNotNull` and `itemIsAValidDate`. |
| validation.regexp | conditional | string | Required for regexp validations. |
| validation.plsqlCodeRaisingError | conditional | plsql | Required for `type: plsqlError`. |
| validation.alwaysExecute | optional | boolean | Execute regardless of item changes. |
| error.errorMessage | yes | string | Message shown on failure. |
| error.associatedItem | conditional | string | Required for page-item validations; item alias (`@P1_ITEM`). |
| error.associatedColumn | conditional | string | Required for interactive grid validations; target column alias (for example `TASK_TYPE`). |
| serverSideCondition.whenButtonPressed | optional | string | Button alias gating execution. |
| security.authorizationScheme | optional | string | Authorization scheme alias. |

---

# Output Template – Full
```
validation {{validationStaticId}} (
    name: {{validationName}}
    execution {
        sequence: {{execution.sequence}}
    }
    validation {
        editableRegion: @{{validation.editableRegion}}
        type: {{validation.type}}
        item: {{validation.item}}
        column: {{validation.column}}
        value: {{validation.value}}
        regexp: {{validation.regexp}}
        language: {{validation.language}}
        plsqlExpression:
            ```plsql
            {{validation.plsqlExpression}}
            ```
        sqlExpression:
            ```sql
            {{validation.sqlExpression}}
            ```
        sqlQuery:
            ```sql
            {{validation.sqlQuery}}
            ```
        plsqlFunctionBody:
            ```plsql
            {{validation.plsqlFunctionBody}}
            ```
    }
    error {
        errorMessage: {{error.errorMessage}}
        associatedItem: @{{error.associatedItem}}
        associatedColumn: {{error.associatedColumn}}
    }
    serverSideCondition {
        whenButtonPressed: @{{serverSideCondition.whenButtonPressed}}
    }
    security {
        authorizationScheme: @{{security.authorizationScheme}}
    }
)
```

---

# Conditional Rendering Rules

- Include only the validation body block(s) required for the selected `validation.type`.
- Before adding user-facing `raise_application_error` logic to a process, first attempt these validation options in order:
  - item / column validation
  - expression validation
  - SQL validation
  - function-body validation only when the above cannot express the rule
- Use validations for user-facing messages such as `Choose ...`, `Select ...`, `Enter ...`, `Fill ...`, `Must provide ...`, and similar correctable input prompts.
- Reserve process-level raised errors for runtime or business failures that occur after validation scope, such as packaged API exceptions, optimistic-lock conflicts, or DML invariants that cannot be checked safely in advance.
- Render `editableRegion` only for interactive grid validations.
- Render `column` only for declarative interactive grid validations; render `item` only for page-item validations.
- Render `associatedColumn` only for interactive grid validations; render `associatedItem` only for page-item validations.
- For expression-style validations with explicit language and no `type`, document the relevant language attribute (for example `sqlExpression`).
- For `itemIsAValidDate`, render `type` plus `item` only; do not render `value`.
- For `columnIsAValidDate` and `columnIsAValidTimestamp`, render `editableRegion`, `type`, and `column` only; do not render `value`.
- Remove `serverSideCondition` and `security` when not gating execution or access.
- Ensure item aliases, editable region references, column aliases, and button references exist on the target page.
- For SQL-based validations, submit dependent items before execution.
