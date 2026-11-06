# Item Computation Prompts

Purpose
- Structured prompts for computation batch workflows.

Prompt scaffold
- "Apply `<computation_type>` computation to items `<item list>` across pages `<pages>` with execution point `<point>` and logic `<logic>`."
- Include:
  - computation_type (`sqlQuery`, `sqlQueryMultipleValues`, `expression`, `functionBody`, `invokeApi`)
  - execution_point
  - sequence
  - logic body
  - targets and optional per-target overrides

Example
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

Checklist
- Use bind syntax and avoid side effects.
- Keep datatype compatibility with target items.
- Ensure deterministic ordering for multi-value SQL.
