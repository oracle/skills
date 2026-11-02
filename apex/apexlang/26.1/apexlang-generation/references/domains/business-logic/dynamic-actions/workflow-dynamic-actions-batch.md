# Workflow: Dynamic Actions — Batch Apply

Purpose
- Apply a single dynamic-action archetype across multiple Oracle APEX pages with consistent behavior while preserving guardrails.

Required inputs
- `operation`: apply (default).
- `archetype`: one of the catalog templates under `templates/business-logic/dynamic-actions/`.
- `targets`: list of page target objects (for example `{ page: 10, overrides?: { region, item, button, ... } }`).
- Optional single-target convenience input: `target` (same structure as one `targets` entry; normalized to a one-item list).
- Backward compatibility: accept `target_pages` and normalize to `targets` with page-only entries.
- For each target page, identifiers for items/regions/buttons the dynamic action references (e.g., region static ID, item names).
- Shared parameters: condition values, itemsToSubmit, API names, threshold values, etc. (only once unless overridden per page).

Clarify — progressive prompts
- Confirm the archetype (refresh after dialog, set value SQL, execute API, etc.).
- Ask for shared attributes (e.g., compare value, API package.procedure) that apply to every page.
- Iterate over each target in `targets`:
  - Confirm page number/alias.
  - Collect any overrides (different region/item IDs, button names, or additional settings).
- If any required identifier is missing for a page, record “Missing Inputs — Page <n>” and halt rather than guessing.

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md
- references/policies/memory-bank/20-data/apex.logic.md
- Tier 1 child workflow for single-page dynamic actions: `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions.md`

Execution model
- Normalize `target`/`target_pages` -> `targets`.
- When the selected archetype is `dynamic-actions.execute-server-side-code.md`, prompt for shared API metadata (package, routine, itemsToSubmit) and confirmation/notification text before iterating pages.
- Capture shared API metadata (`api_package`, `api_routine`, `items_to_submit`) when building execute-API batches.
- For each target, invoke the single-page dynamic-action workflow with the merged shared + page-specific parameters.
- Collect per-page draft summaries under `the temp-runtime reports directory under `APEXLANG_OUTPUT_ROOT/reports/`{page_alias}_dynamic-action.summary.md` while staging the actual page changes only in the transient draft app.
- Aggregate critiques to highlight per-page issues while preserving one consolidated change log.
- Ensure unique dynamic-action names per page (e.g., `DA_REFRESH_REPORT_P10`).

Completion
- Revision writes finals to each page file.
- Produce consolidated change log summarizing `operation`, pages updated, and any per-page overrides.
- Recommend updating navigation/breadcrumb only if the single-page workflow flags it (usually unnecessary for DAs).

Notes
- Batch workflow orchestrates the single-page workflow; it does not introduce new templates.
- For destructive server actions, enforce confirm → invokeApi → refresh sequence on every page.
- If pages share identical identifiers, confirm the user intends duplicates; otherwise request unique IDs to avoid runtime collisions.
