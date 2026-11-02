# Workflow: Dynamic Actions

Purpose
- Generate or modify APEX dynamic actions using canonical templates while enforcing guardrails (page process invokeApi-default with thin-wrapper exception, appProcess executeCode-only, named notation, DA_ naming).

Required inputs
- Target page number and dynamic action identifier (new or existing).
- Trigger definition (event + selection type + selector/region/items).
- Affected elements (items, regions, DOM object, event source).
- For server-side interactions: packaged API name or inline PL/SQL purpose, required itemsToSubmit, and target region(s).

Clarify — progressive prompts
- Does the dynamic action rely on existing items/regions/buttons? Identify each by static ID or name.
- What condition governs execution (client-side condition, threshold, JavaScript expression)? Capture comparison values or expressions.
- Are debounce, throttle, or plugin events required? Note plugin static IDs and interval settings.
- For destructive/server operations, confirm confirmation messaging, notification text, and the API endpoint (package.procedure or invokeApi parameters).
- If any attribute is missing, record “Missing Inputs” and halt rather than inventing values.
 - When invoked from a natural sentence, ask only for data that was not supplied (e.g., “Which region should be refreshed?”) and echo back assumptions for confirmation before drafting.

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md
- references/policies/memory-bank/20-data/apex.logic.md

Templates
- Primary catalog: `templates/business-logic/dynamic-actions/` (select archetype based on requested behavior).
- For historical compatibility only, `templates/business-logic/dynamic-actions/dynamic-actions.refresh-region-after-dialog.md` (use when prompt explicitly references the legacy snippet).
- Coordinate with apex-generation agents:
  - Draft: `references/workflows/apex-generation/agents/20-agent-draft.md`
  - Critique: `references/workflows/apex-generation/agents/30-agent-critique.md`
  - Revision: `references/workflows/apex-generation/agents/40-agent-revision.md`

Rules & checks
- Enforce `DA_<Purpose>` naming (see apex.logic.md).
- Enforce approved `when.event` values from `templates/business-logic/dynamic-actions/dynamic-actions._common.md`; do not invent aliases such as `dialogClosed`.
- For modal dialog refresh, use `apexafterclosedialog`; use `apexafterclosecanceldialog` only when the behavior is explicitly tied to cancel-close flows.
- Map action types to the closest template (show/hide, enable/disable, set value via SQL/PLSQL/JS, invoke API, timer, slider behaviors, focus, debounce/throttle, plugin styling).
- Verify `itemsToSubmit` is scoped to required items; flag if omitted for server actions.
- Ensure inline PL/SQL uses named notation and is marked for conversion to invokeApi when packaged APIs exist.
- Confirm confirmation/notification sequence for destructive flows (Confirm → submit key item → execute API → refresh → notify).

Completion
- Draft updates go directly to the target page artifact; critique must reference template alignment, guardrail compliance, and any companion summary logged under `the temp-runtime reports directory under `APEXLANG_OUTPUT_ROOT/reports/``.
- Revision updates final artifact under the target page path.
- If new components were added, recommend updating Component Registry synonyms when novel phrases arise.
