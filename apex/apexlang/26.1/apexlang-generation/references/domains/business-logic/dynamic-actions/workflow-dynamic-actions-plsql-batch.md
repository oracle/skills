# Workflow: Dynamic Actions — Execute API Batch

Purpose
- Apply execute-API dynamic actions across multiple pages while enforcing process policy split (page process invokeApi-default with thin-wrapper exception; appProcess executeCode-only) and shared parameter contracts.

Required inputs
- `operation`: apply (default).
- `targets`: list of page target objects (for example `{ page: 10, overrides?: { selector, target_region, message } }`).
- Optional single-target convenience input: `target` (same structure as one `targets` entry; normalized to a one-item list).
- Backward compatibility: accept `target_pages` and normalize to `targets` with page-only entries.
- `api_package`: consolidated API package (for example, `app_process_api`).
- `api_routine`: package procedure/function.
- `items_to_submit`: list of page items submitted before execution.
- Optional: confirmation text, success notification, refresh target region per page.

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md
- references/policies/memory-bank/20-data/apex.logic.md
- references/domains/business-logic/dynamic-actions/workflow-dynamic-actions-batch.md
- Template: `templates/business-logic/dynamic-actions/dynamic-actions.execute-server-side-code.md`

Execution model
- Normalize `target`/`target_pages` -> `targets`.
- Collect shared API contract once (`api_package`, `api_routine`, `items_to_submit`).
- For each target in `targets`, merge page-specific identifiers (selector, target region, messages).
- Generate execute-API DA blocks using the canonical dynamic-action template and per-page naming.

Completion
- Draft summaries are grouped per page under `the temp-runtime reports directory under `APEXLANG_OUTPUT_ROOT/reports/``, while the actual DSL changes are staged directly in the target app.
- Revision writes final page updates and records `operation`, consolidated page list, and API contract in change log.

Notes
- Missing identifiers for any page must halt the batch with `Missing Inputs — Page <n>`.
- For package calls in page processes, route to `references/domains/business-logic/processes/workflow-page-processes-batch.md`.
