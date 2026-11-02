---
templateId: computations.common
componentType: computation
version: 1.0
imports:
  - validations._common
description: Shared contract for computation templates.
---

# Purpose

Define the canonical variable contract, guardrails, and template skeleton for page/item computations.

---

# Generation Rules (MANDATORY)

1. Load `references/policies/memory-bank/20-data/apex.logic.md` before drafting computations.
2. Populate all required variables from this contract; scenario files may only specialize optional sections.
3. When calling packaged logic, prefer `type: invokeApi` with explicit parameter blocks, allowing a thin `executeCode` wrapper only when direct page-item assignment is the reliable runtime-safe choice for a page-coupled flow.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| computationStaticId | yes | string | Static identifier (`COMP_<context>`). |
| computationName | yes | string | Builder display name. |
| location | yes | enum | `pageProcess` or `item`. |
| computationPoint | yes | enum | Execution timing (Before Header, After Submit, etc.). |
| item | conditional | string | Required for item-level computations. |
| type | yes | enum | `staticValue`, `item`, `expression`, `sqlQuerySingleValue`, `sqlQueryMultipleValues`, `functionBody`, `invokeApi`, `execute`. |
| language | conditional | enum | Use when `type: expression` relies on SQL (`language: sql`). |
| plsqlExpression | conditional | plsql | Body for PL/SQL expressions. |
| sqlQuery | conditional | sql | Single-value SQL query. |
| sqlQueryMulti | conditional | sql | Multi-value SQL query (pair with `assignValue`). |
| plsqlFunctionBody | conditional | plsql | Function body returning a scalar. |
| invoke.package/function | conditional | string | Package routine for `invokeApi`. |
| parameter.* | conditional | object | Parameter mapping blocks for `invokeApi`. |
| executionSequence | optional | number | Ordering when multiple computations exist. |
| staticValue | conditional | string | Literal assignment for `type: staticValue`. |
| sourceItem | conditional | string | Source item name for `type: item`. |
| assignValue.* | conditional | mapping | Column-to-item mapping for multi-value SQL. |

---

## Required Variables
- computationStaticId:
  - Type: string
  - Accepted inputs:
    - Uppercase identifiers prefixed with `COMP_`
    - Optional context suffixes separated by underscores (e.g., `COMP_INIT_TIME_ZONE`)
  - Validation:
    - Must be unique within the page or application export
- computationName:
  - Type: string
  - Accepted inputs:
    - Builder-friendly labels up to 255 characters
    - No leading/trailing whitespace or control characters
  - Guidance:
    - Use title case or sentence case for readability
- location:
  - Type: enum
  - Accepted values:
    - pageProcess
    - item
  - Guidance:
    - Choose `pageProcess` when the computation is not tied to a specific item
    - Choose `item` when targeting a named page or application item
- computationPoint:
  - Type: enum
  - Accepted values:
    - afterAuthentication
    - beforeHeader (default)
    - afterHeader
    - afterRegions
    - beforeRegions
    - afterSubmit
    - beforeFooter
    - afterFooter
  - Guidance:
    - Match the timing guidance in `references/policies/memory-bank/20-data/apex.logic.md`
- type:
  - Type: enum
  - Accepted values:
    - staticValue
    - item
    - expression
    - sqlQuerySingleValue
    - sqlQueryMultipleValues
    - functionBody
    - invokeApi
    - execute (legacy; prefer invokeApi)
  - Validation:
    - Must align with the scenario template used for the computation
- item (conditional when `location: item`):
  - Type: string
  - Accepted inputs:
    - Page item names (e.g., `P10_STATUS`)
    - Application item names (e.g., `APP_TIMEZONE`) when allowed by context
  - Validation:
    - Must reference an item defined within the application export
- language (conditional when `type: expression`):
  - Type: enum
  - Accepted values:
    - plsql (default; omit for PL/SQL)
    - sql (required for SQL expressions)
- plsqlExpression / plsqlFunctionBody (conditional):
  - Type: PL/SQL text
  - Accepted inputs:
    - Named-notation PL/SQL blocks adhering to the invokeApi-first policy
    - Wrap multi-line content in triple backticks with `plsql` hint
- sqlQuerySingleValue / sqlQueryMulti (conditional):
  - Type: SQL text
  - Accepted inputs:
    - Deterministic `select` statements with explicit column lists
    - Bind variables for runtime values (e.g., `:P10_ID`)
    - Wrap in triple backticks with `sql` hint
- staticValue (conditional for `type: staticValue`):
  - Type: string
  - Accepted inputs:
    - Literal values (`10`, `Y`, `Initialized`)
    - Substitution strings (`&APP_USER.`, `#DATE#`) approved by governance
  - Reference:
    - See `computations.static-value.md` for item-level static assignments
- sourceItem (conditional for `type: item`):
  - Type: string
  - Accepted inputs:
    - Page or application item names that already exist (e.g., `P20_ITEM_A`, `APP_TIMEZONE`)
  - Validation:
    - Must not create new items implicitly; the source must be defined elsewhere
  - Reference:
    - See `computations.set-from-item.md` for item-to-item assignments
- assignValue.* (conditional for `sqlQueryMultipleValues`):
  - Type: mapping
  - Accepted inputs:
    - `item`: Target item name per column
    - `column`: Alias returned by the SQL query
- invoke.package / invoke.procedureOrFunction (conditional for `invokeApi`):
  - Type: string
  - Accepted inputs:
    - Package and routine names defined in the schema
    - Must align with consolidated `app_process_api` unless justified otherwise
- parameter.* (conditional for `invokeApi`):
  - Type: object
  - Accepted inputs:
    - `name`: Parameter name from the package signature
    - `direction`: `in`, `out`, or `in out`
    - `value`: Item or expression following `apex.logic.md` rules
- executionSequence (optional):
  - Type: number
  - Accepted inputs:
    - Positive integers establishing ordering among computations

# Output Template – Full
```
computation {{computationStaticId}} (
    name: {{computationName}}
    location: {{location}}
    computationPoint: {{computationPoint}}
    type: {{type}}
    item: {{item}}
    language: {{language}}
    plsqlExpression: {{plsqlExpression}}
    sqlQuery:
        ```sql
        {{sqlQuery}}
        ```
    plsqlFunctionBody:
        ```plsql
        {{plsqlFunctionBody}}
        ```
    executionSequence: {{executionSequence}}
    assignValue (
        item: {{assignValue.item}}
        column: {{assignValue.column}}
    )
    invoke {
        package: {{invoke.package}}
        procedureOrFunction: {{invoke.procedureOrFunction}}
    }
    parameter {{parameter.name}} (
        direction: {{parameter.direction}}
        value {
            item: {{parameter.value.item}}
        }
    )
)
```

---

# Conditional Rendering Rules

- Omit `item` when `location` is `pageProcess` and the computation does not target an item.
- Include only the expression/logical block required by `type` (PL/SQL, SQL, function body, or invokeApi).
- Provide one `assignValue` block per target item when `type: sqlQueryMultipleValues`.
- Remove optional blocks (`language`, `executionSequence`, `parameter`) when not needed by the scenario template.
