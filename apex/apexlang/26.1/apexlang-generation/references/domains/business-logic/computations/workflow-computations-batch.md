# Workflow: Item Computations — Batch Apply

Purpose
- Apply shared item computations (SQL or PL/SQL) across multiple pages while respecting guardrails and per-page overrides.

Required inputs
- `operation`: apply (default).
- `computation_type`: sqlQuery | sqlQueryMultipleValues | expression | functionBody.
- `execution_point`: beforeHeader | afterHeader | afterSubmit | beforeRegions | afterFooter (as needed).
- `sequence`: default sequence number applied unless overridden per target.
- `logic_body`: SQL or PL/SQL text (triple backticks for SQL/PLSQL bodies).
- `targets`: list of objects `{ page: <page>, item: <Pnn_ITEM>, sequence?: <number>, overrides?: { logic_body, execution_point } }`.
- Optional single-target convenience input: `target` (same structure as one `targets` entry; normalized to a one-item list).
- Backward compatibility: accept `target_items` and normalize it to `targets`.
- Optional: `conditions`: server-side condition tokens per item (if required), `comments` for change log.

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md
- references/policies/memory-bank/20-data/apex.logic.md (section 9 guardrails)
- Template directory: `templates/business-logic/computations`

Execution model
- Normalize `target`/`target_items` -> `targets`.
- Validate computation type and default execution point.
- Confirm logic body matches the selected type (e.g., SQL query vs PL/SQL expression).
- For each target:
  - Merge shared defaults with overrides (sequence, execution point, logic body).
  - Invoke the single-item computation template corresponding to `computation_type`.
- Create a compact run summary under `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/`` only when the workflow needs durable evidence, summarising targets, type, execution point, and logic hash.
- Do not publish app-file changes in the batch run until approval is granted.

Completion
- Record a compact status entry only when the workflow explicitly persists durable evidence.
- Revision applies approved computation changes and publishes finals to target pages after approval.

Notes
- Enforce guardrails (bind syntax, no side effects, deterministic ordering for multi-value SQL).
- If any target lacks required inputs, halt and record Missing Inputs for that page/item.
- Encourage routing complex logic into packaged APIs and refer to them via `expression` or `functionBody` wrappers.
