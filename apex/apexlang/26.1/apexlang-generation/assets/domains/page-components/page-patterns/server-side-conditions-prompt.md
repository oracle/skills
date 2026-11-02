# Oracle APEX Server-Side Conditions — Reusable Prompts

These prompt snippets help AI tooling emit consistent, guardrail-compliant server-side conditions across component types. Align questions with the orchestration workflows and memory-bank rules before execution.

## 1. Request/Value-Based Conditions
- **Use when:** Toggling behavior by APEX request value or feature flag token.
- **Inputs to collect:** request value(s), target components.
- **Prompt scaffold:**
  - “Apply request-value condition `<REQUEST>` to [component list]; fail if catalog attributes missing.”
- **Example draft summary:**

```
Summary: Apply `ssc.feature.flagEnabled("SALES")` to P10_SAVE button and P20_PROCESS_ORDER process

- Intent: Show Save button only when SALES flag enabled.
- Condition: `:REQUEST = 'FEATURE_SALES_ENABLED'`
- Note: Request value derives from feature toggle mapping; no null handling required.
```

## 2. Item Equality / Inequality Conditions
- **Use when:** Show/hide components based on item value comparisons.
- **Inputs to collect:** item name, target values, null handling preference.
- **Prompt scaffold:**
  - “Guard [component] when `:Pnn_ITEM` equals `<VALUE>`; ensure NVL handling if nulls allowed.”
- **Example draft summary:**

```
Summary: Guard Delete button when status is not active

- Intent: Hide Delete when record is inactive.
- Condition: `NVL(:P50_STATUS, 'INACTIVE') != 'ACTIVE'`
- Note: Null fallback prevents null comparison issues.
```

## 3. List Membership Conditions
- **Use when:** Component availability depends on item-in-list rules.
- **Inputs to collect:** item, allowed values, case sensitivity expectations.
- **Prompt scaffold:**
  - “Render [component] only when `:Pnn_STATUS` in `<VAL1:VAL2:VAL3>` list.”
- **Example draft summary:**

```
Summary: Permit Submit button for new-or-pending statuses

- Intent: Show Submit when status is NEW or PENDING.
- Condition: `:P15_STATUS IN ('NEW', 'PENDING')`
- Note: Item is varchar2; upstream logic enforces uppercase.
```

## 4. Numeric Guard Conditions
- **Use when:** Require numeric fields to be present and within thresholds.
- **Inputs to collect:** item, minimum/maximum bounds, zero/negative tolerance.
- **Prompt scaffold:**
  - “Allow processing when `:Pnn_AMOUNT` > `<threshold>`; block null/zero cases.”
- **Example draft summary:**

```
Summary: Enable Process Order when amount entered

- Intent: Proceed only when order amount is positive.
- Condition: `:P35_ORDER_AMOUNT IS NOT NULL AND :P35_ORDER_AMOUNT > 0`
- Note: Item is number; null check precedes numeric comparison.
```

## 5. Date Window Conditions
- **Use when:** Start/end dates must be provided and ordered.
- **Inputs to collect:** start item, end item, inclusive/exclusive expectations.
- **Prompt scaffold:**
  - “Render report only when both dates present and start <= end.”
- **Example draft summary:**

```
Summary: Render P30_REPORT region when valid date range supplied

- Intent: Display report when start/end dates provided and in range.
- Condition:
  :P30_START_DATE IS NOT NULL
  AND :P30_END_DATE IS NOT NULL
  AND :P30_START_DATE <= :P30_END_DATE
- Note: Items are DATE; comparison safe after null checks.
```

## 6. EXISTS Ownership Checks
- **Use when:** Visibility depends on data ownership or contextual row existence.
- **Inputs to collect:** table/view, join columns, security predicate.
- **Prompt scaffold:**
  - “Allow action when current user owns the referenced record via EXISTS query; require bind variables.”
- **Example draft summary:**

```
Summary: Permit approval when user owns the order

- Intent: Allow approval only for orders owned by current user.
- Condition:
  EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.order_id = :P45_ORDER_ID
    AND o.created_by = :APP_USER
  )
- Note: ORDER_ID item is numeric and required upstream.
```

## 7. PL/SQL Expression Conditions (section 8 guardrails)
- **Use when:** Condition type is `plsqlExpression` and boolean logic extends beyond catalog shortcuts.
- **Mandatory guardrails:** bind syntax, explicit null handling, no DML/dynamic SQL, datatype alignment (see references/policies/memory-bank/20-data/apex.logic.md §8).
- **Prompt scaffold:**
  - “Draft plsqlExpression with one-line intent + expression; enforce section 8 guardrails and block on violations.”
- **Example draft summary:**

```
Summary: Validate availability window for scheduled job region

- Intent: Render job status region only within active schedule window.
- Condition:
  :P60_ACTIVE_FLAG = 'Y'
  AND :P60_START_TS IS NOT NULL
  AND :P60_END_TS IS NOT NULL
  AND :P60_START_TS <= SYSTIMESTAMP
  AND SYSTIMESTAMP <= :P60_END_TS
- Note: Timestamp items required; no nulls allowed once active flag is Y.
```

### Guardrail Fail Example

```
Summary: Proposed predicate rejected (missing bind and null safety)

- Intent: Hide Delete when record is inactive.
- Proposed: `P50_STATUS != 'ACTIVE'`
- Violations:
  - Missing colon prefix on item reference.
  - Null-unsafe inequality; requires `NVL(:P50_STATUS, 'INACTIVE') != 'ACTIVE'`.
- Action: Mark entry as `state: blocked` and request correction.
```

---

**Usage tips**
- Pair these snippets with the SSC batch workflow to capture intent, condition, and notes in run summaries before applying direct app-file changes.
- Reference references/policies/memory-bank/20-data/apex.logic.md §8 for enforcement details and reviewer checklist.
