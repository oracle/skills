# Workflow: Button Actions — Apply/Remove (Single + Batch)

Purpose
- Apply or remove button components across one or many pages/regions while enforcing guardrails.

Required inputs
- `operation`: apply | remove (default `apply`).
- `action_type`: submitPage | redirectThisApp | redirectOtherApp | triggerAction | menu. Required when `operation = apply`.
- `layout_defaults`: slot, sequence, region static id (overridable per target). Used when `operation = apply`.
- `appearance_defaults`: template, hot/showAsDisabled flags, icons, and canonical emitted `templateOptions` values from the button contract (for example `t-Button--iconLeft`, not `left`). Used when `operation = apply`.
- `behavior_defaults`: confirmation settings, databaseAction, targets, warnOnUnsavedChanges. Used when `operation = apply`.
- `targets`: list of `{ page, region, buttonName, overrides? { layout, appearance, behavior, confirmation, serverSideCondition } }`.
- Optional single-target convenience input: `target` (same structure as one `targets` entry; normalize to a one-item list).
- Backward compatibility: accept `target_buttons` / `target_button` and normalize to `targets`.
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
- Normalize `target`/`target_buttons`/`target_button` -> `targets`.
- Validate operation mode:
  - `apply`: validate `action_type` and required attributes (target for redirects, databaseAction for submit DML, nested entries for menus), then merge shared defaults with per-target overrides before invoking templates.
  - `remove`: perform hard-delete prechecks before removal.
- Remove prechecks (fail-fast, deterministic):
  - Resolve exact target button by page + region + buttonName.
  - Reject `not_found` and `ambiguous` targets.
  - Scan dependencies and block removal when references exist, including:
    - Dynamic actions using button aliases (`when.selectionType: button`)
    - `serverSideCondition.whenButtonPressed`
    - Process/request guards that depend on the button request semantics
- Produce a compact run summary under `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/`` only when the workflow explicitly needs durable evidence, summarising targets, operation, and per-target status (`applied`, `removed`, `blocked`, `not_found`, `ambiguous`) with blockers.
- Do not apply direct page-file changes until the approval loop is satisfied.

Completion
- Record a compact status entry only when the workflow explicitly persists durable evidence.
- Revision agent applies approved changes, updates page files, and records applied or reverted state only when needed.

Notes
- Ensure layout.slot is valid for each target region (consult apex.templates.md).
- For `appearance_defaults.templateOptions`, use canonical emitted button UT class values from `templates/buttons/buttons._common.md` and `references/policies/memory-bank/40-components/apex.buttons.md`; do not use aliases/static_ids.
- When `operation = apply` and action_type = submitPage, remind users to guard related processes; batch invokeApi handling remains in `references/domains/business-logic/processes/workflow-page-processes-batch.md`.
- If the prompt asks for a translation/language button, do not reinterpret it as navigation/menu generation. Clarify whether the user wants runtime language switching or text-message localization.
- When the user confirms a runtime language-switch button, default to `action_type = submitPage` and pair it with a page process guarded by `whenButtonPressed`; do not default to redirect actions for this pattern.
- For menu entries, gather child behaviors in structured inputs (redirect targets, triggerAction bodies) and validate icons/template options.
- Remove mode default is hard delete + reference checks; do not auto-clean dependent dynamic actions/processes/server-side conditions in the same run.
