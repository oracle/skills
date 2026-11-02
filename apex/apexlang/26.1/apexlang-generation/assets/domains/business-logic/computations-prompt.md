# Item Computation Prompts

## Purpose
Structured prompts to gather inputs for the computation batch workflow (`computation-plsql-batch`).

## Prompt Scaffold
- "Apply `<computation_type>` computation to items `<item list>` across pages `<pages>` with execution point `<point>` and logic `<logic>`".
- Include:
  - computation_type (sqlQuery, sqlQueryMultipleValues, expression, functionBody, invokeApi).
  - execution_point (beforeHeader, afterSubmit, etc.).
  - default sequence.
  - shared logic body (SQL/PLSQL text).
  - target items with page references and overrides.
  - optional conditions or comments.

## Example
```
Apply item computations across pages 1 and 2:
- computation_type: expression
- execution_point: beforeHeader
- sequence: 30
- logic_body: 'Hello ' || :APP_USER
- target_items:
  - { page: 1, item: P1_DISPLAY_EXP }
  - { page: 2, item: P2_DISPLAY_EXP }
```

## Checklist
- Confirm logic uses bind syntax and no side effects.
- Verify data types align with target items.
- Ensure multi-value SQL includes deterministic ordering.
- Capture overrides (sequence/execution point) per item when they differ.
