# Workflow: Page Processes — Invoke API Batch

Purpose
- Apply an `invokeApi` page process across multiple pages, wiring button guards, sequences, and parameters consistently.

Required inputs
- `operation`: apply (default).
- `api_package`: consolidated package name (e.g., `app_process_api`).
- `api_routine`: procedure/function name (e.g., `save_order`).
- `api_kind`: `procedure` or `function`.
- `targets`: list of page target objects (for example `{ page: 20, overrides?: { button_guard, parameters, sequence } }`).
- Optional single-target convenience input: `target` (same structure as one `targets` entry; normalized to a one-item list).
- Backward compatibility: accept `target_pages` and normalize to `targets` with page-only entries.
- `button_guard`: button name guarding the process (if applicable).
- `parameters`: list describing item/expression mappings per parameter.
- Optional: success message, server-side condition, execution sequence overrides.

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md
- references/policies/memory-bank/20-data/apex.logic.md
- Template: `templates/business-logic/processes/processes.invoke-api.md`

Execution model
- Normalize `target`/`target_pages` -> `targets`.
- Gather shared API details (package, routine, parameters, button guard).
- If `api_kind = function`, use the validated page-process return mapping shape:
  - nested `parameter { direction: out, dataType: <type>, ignoreOutput: false }`
  - `value { item: <target item> }`
  - `advanced { displaySequence: <n> }`
- For this validated function-return shape, do not emit `value.type`, and do not move `direction`, `dataType`, or `ignoreOutput` to the top level of the `parameter (...)` block.
- Iterate through each target in `targets`:
  - Merge shared data with page-specific overrides (button names, condition tokens, parameter values).
  - Insert or update an invokeApi process using the process template.
- Name convention: `PROC_<PURPOSE>_P<page>`.

Completion
- Revision writes process definitions into each target page file and records `operation` plus page/process pairs in the change log.
- Critique ensures invokeApi is used, parameters match the shared bundle, and no executeCode remains.

Notes
- Ensure buttons exist before binding the process; emit Missing Inputs if not provided.
- For On Demand/AJAX variants, adjust execution point accordingly.
- Combined with `20-data/apex.logic.md`, this workflow enforces consolidated package usage.
- This function-return shape is validated for page `invokeApi` processes by live SQLcl `apex validate`; prefer it over thin `executeCode` wrappers when the goal is specifically to keep packaged function calls declarative.
