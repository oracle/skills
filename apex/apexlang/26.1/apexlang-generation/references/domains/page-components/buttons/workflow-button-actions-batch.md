# Workflow: Button Actions — Batch Apply

Purpose
- Apply shared button configurations (submit, redirect, triggerAction, menu) across multiple pages while enforcing guardrails.

Required inputs
- `action_type`: submitPage | redirectThisApp | redirectOtherApp | triggerAction | menu.
- `layout_defaults`: slot, sequence, region static id (overridable per target).
- `appearance_defaults`: template, hot/showAsDisabled flags, icons, and canonical emitted `templateOptions` values from the button contract (for example `t-Button--iconLeft`, not `left`).
- `behavior_defaults`: confirmation settings, databaseAction, targets, warnOnUnsavedChanges.
- `target_buttons`: list of `{ page, region, buttonName, overrides? { layout, appearance, behavior, confirmation, serverSideCondition } }`.
- Optional: nested menu entries or triggerAction payloads (SQL/PLSQL bodies, itemsToSubmit/Return).

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md
- references/policies/memory-bank/40-components/apex.buttons.md
- Templates:
  - `templates/buttons/buttons._common.md`
  - `templates/buttons/buttons._index.md`
  - Action-specific template selected by `action_type`:
    - submitPage -> `templates/buttons/buttons.submit.md`
    - redirectThisApp -> `templates/buttons/buttons.redirect-this-app.md`
    - redirectOtherApp -> `templates/buttons/buttons.redirect-other-app.md`
    - definedByDynamicAction -> `templates/buttons/buttons.defined-by-da.md`
    - triggerAction -> `templates/buttons/buttons.trigger-action.md`
    - menu -> `templates/buttons/buttons.menu.md`

Execution model
- Validate `action_type` and ensure required attributes are provided (e.g., target for redirects, databaseAction for submit DML, nested entries for menus).
- Merge shared defaults with per-target overrides before invoking the button template.
- For triggerAction/menu entries, capture nested definitions and ensure they meet guardrails (no side effects, proper itemsToSubmit/Return).
- Produce a compact run summary under `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/`` only when the workflow explicitly needs durable evidence, summarising targets, action_type, layout slot, and confirmation state.
- Do not apply direct page-file changes until the approval loop is satisfied.

Completion
- Record a compact status entry only when the workflow explicitly persists durable evidence.
- Revision agent applies approved changes, updates page files, and records applied or reverted state only when needed.

Notes
- Ensure layout.slot is valid for each target region (consult apex.templates.md).
- For `appearance_defaults.templateOptions`, use canonical emitted button UT class values from `templates/buttons/buttons._common.md` and `references/policies/memory-bank/40-components/apex.buttons.md`; do not use aliases/static_ids.
- When action_type = submitPage, remind users to guard related processes; batch invokeApi handling remains in `references/domains/business-logic/processes/workflow-page-processes-batch.md`.
- For menu entries, gather child behaviors in structured inputs (redirect targets, triggerAction bodies) and validate icons/template options.
