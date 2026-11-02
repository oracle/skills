# Oracle APEX Server-Side Conditions — Reusable Prompts

Purpose
- Provide reusable prompt scaffolds to test and generate `serverSideCondition {}` blocks for any APEXlang DSL component that supports server-side conditions.
- Applies across pages, regions, items, buttons, dynamic actions, and processes where the DSL permits a server-side condition block.

Rule source
- `references/policies/memory-bank/20-data/apex.logic.md`
- Use only supported condition `type` values and required attributes.

## 1. Request/Value-Based Conditions
- Use when toggling behavior by APEX request value or feature flag token.
- Prompt scaffold:
  - "Apply request-value condition `<REQUEST>` to [component list]; fail if catalog attributes are missing."

Example draft summary:
```
Summary: Apply `ssc.feature.flagEnabled("SALES")` to P10_SAVE button and P20_PROCESS_ORDER process

- Intent: Show Save button only when SALES flag enabled.
- Condition: `:REQUEST = 'FEATURE_SALES_ENABLED'`
- Note: Request value derives from feature toggle mapping.
```

## 2. Item Equality / Inequality Conditions
- Use when showing/hiding components based on item value comparisons.
- Prompt scaffold:
  - "Guard [component] when `:Pnn_ITEM` equals `<VALUE>`; ensure NVL handling if nulls are allowed."

Example:
```
Summary: Guard Delete button when status is not active
- Condition: `NVL(:P50_STATUS, 'INACTIVE') != 'ACTIVE'`
```

## 3. List Membership Conditions
- Use when availability depends on item-in-list rules.
- Prompt scaffold:
  - "Render [component] only when `:Pnn_STATUS` in `<VAL1:VAL2:VAL3>` list."

## 4. Numeric Guard Conditions
- Use when numeric fields must be present and within thresholds.
- Prompt scaffold:
  - "Allow processing when `:Pnn_AMOUNT` > `<threshold>`; block null/zero cases."

## 5. Date Window Conditions
- Use when start/end dates must be present and ordered.
- Prompt scaffold:
  - "Render region only when both dates are present and start <= end."

## 6. EXISTS Ownership Checks
- Use when visibility depends on data ownership or row existence.
- Prompt scaffold:
  - "Allow action when current user owns the referenced record via EXISTS query; require bind variables."

## 7. `plsqlExpression` Conditions (Guardrails)
- Use when logic exceeds catalog shortcuts.
- Mandatory guardrails:
  - bind syntax for items/contexts
  - explicit null handling
  - no DML
  - no dynamic SQL
  - datatype-safe comparisons

Prompt scaffold:
- "Draft a `plsqlExpression` with one-line intent + expression; enforce apex.logic guardrails and block on violations."

Guardrail fail example:
```
Summary: Proposed predicate rejected (missing bind and null safety)
- Proposed: `P50_STATUS != 'ACTIVE'`
- Violations:
  - Missing colon prefix on item reference.
  - Null-unsafe inequality; requires `NVL(:P50_STATUS, 'INACTIVE') != 'ACTIVE'`.
- Action: Mark as blocked and request correction.
```

Usage notes
- Pair with SSC batch workflows for summary-first review before applying direct app-file changes.
- Never invent condition types or attributes outside `apex.logic.md`.
