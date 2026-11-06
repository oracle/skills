---
templateId: app-computations
componentType: app-computations
version: 1.0
---

# Purpose

The app computations component defines application-level computations that set values for application items during application processing points.

---

# Generation Rules (MANDATORY)

**Important**

If the item referenced is not found in the application, then DO NOT create the computation and stop this process!

1. Create the app computation id.
2. Render exactly one `computation {}` strategy per app computation.
3. All updates should be made to the app-computations.apx file found under an application's /shared-components directory.
4. `security {}` is optional. All other values documented as required must be present.

---

# Variable Contract

## Required Variables

- appComputation
  - Type: text
  - The app computation id; lowercase with dashes, no spaces

- itemName
  - Type: text
  - Target application item name
  - Should be a valid item defined within an application under one of the following:
    - /shared-components/app-items.md
    - /pages/*

- execution.sequence
  - Type: number
  - Sequence order for execution

- execution.point
  - Type: enum
  - Valid values:
    - afterAuthentication
    - beforeHeader (default)
    - afterHeader
    - afterRegions
    - beforeRegions
    - afterSubmit
    - beforeFooter
    - afterFooter

- error.errorMessage
  - Type: text
  - Message shown when computation evaluation fails

- computation
  - Type: object
  - Exactly one strategy must be selected from the list below:
    - staticValue
      - `computation.staticValue` (required)
    - expression
      - `computation.type: expression` (required)
      - `computation.plsqlExpression` (required)
    - item
      - `computation.type: item` (required)
      - `computation.itemName` (required)
    - functionBody
      - `computation.type: functionBody` (required)
      - `computation.plsqlFunctionBody` (required; fenced `plsql` block)
    - sqlQuerySingleValue
      - `computation.type: sqlQuerySingleValue` (required)
      - `computation.sqlQuery` (required; fenced `sql` block)
    - sqlQueryMultipleValues
      - `computation.type: sqlQueryMultipleValues` (required)
      - `computation.sqlQuery` (required; fenced `sql` block)

## Optional Variables

- security.authorizationScheme
  - Type: reference
  - Authorization scheme reference (for example `@administration-rights`)
  - If omitted, omit the entire `security {}` block

---

# Conditional Rendering Rules

- `security {}` is optional and rendered only when `security.authorizationScheme` is provided.
- Do not render more than one computation strategy in the same `computation {}` block.
- For `staticValue`, do not render `computation.type`.
- For all non-static strategies, render `computation.type` and its required companion attribute.

---

# Output Template - Static Value
```
appComputation {{appComputation}} (
    itemName: {{itemName}}
    execution {
        sequence: {{execution.sequence}}
        point: {{execution.point}}
    }
    computation {
        staticValue: {{computation.staticValue}}
    }
    error {
        errorMessage: {{error.errorMessage}}
    }
    security {
        authorizationScheme: {{security.authorizationScheme}}
    }
)
```

---

# Output Template - Non-Static
```
appComputation {{appComputation}} (
    itemName: {{itemName}}
    execution {
        sequence: {{execution.sequence}}
        point: {{execution.point}}
    }
    computation {
        type: {{computation.type}}
        {{computation.attribute}}: {{computation.value}}
    }
    error {
        errorMessage: {{error.errorMessage}}
    }
    security {
        authorizationScheme: {{security.authorizationScheme}}
    }
)
```
