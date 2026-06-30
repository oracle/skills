# One‑Message Routers — Pattern and Conventions (Authoritative)

Purpose
- Establish a consistent pattern for one‑message, natural‑language routers that dispatch to “master” workflows.
- Keep routers small, deterministic, and independent (no duplication of workflow logic).
- Accept free-form user input by default: fragments, shorthand, broken grammar, terse phrases, and mixed natural-language commands must still be routable.

Load order
- Keep router contracts inside domain entrypoint skills: `skills/<domain>/SKILL.md`.
- Numeric prefixes determine order; use distinct Match keywords to avoid collisions.

Router contract (machine‑parseable headers)
- Router: true
- Kind: one-message
- TargetWorkflow: <path to workflow md>
- Match: case‑insensitive keywords list that trigger the router
- Optional shared behavior fields:
  - `prompt_normalization: enabled`
  - `clarification_rounds_max: 1`
  - `clarification_style: simple_english`
  - `ambiguity_policy: ask_then_stop`

Routing behavior
- If a single incoming message contains any Match keyword(s) and NO explicit structured inputs block:
  - Invoke TargetWorkflow with Defaults (merged with any simple key: value overrides present in the same message).
- If structured inputs are present, DO NOT route (let the workflow consume them directly).
- Never re‑route to another router or to the constitutional master unless you are the master router.

Prompt-normalization contract
- Treat sparse input as valid by default. Examples: noun lists, shorthand like `source report lookup filter`, broken grammar, partial identifiers, or mixed imperative fragments.
- Normalize whatever is explicit in the prompt before asking anything else.
- Ask follow-up questions only for critical blockers that materially change the workflow, target, or safety gates.
- Follow-ups must be short, plain-English prompts. Prefer concrete options or one missing identifier request over broad re-interviewing.
- Allow at most one clarification round per unresolved ambiguity cluster.
- If critical ambiguity remains after that round, emit `Missing Inputs` and stop; do not guess or require the user to restate the request as a structured payload.

Defaults (safe)
- Defaults must be minimal and safe for “Plan mode” execution.
- Example fields (only if relevant to the TargetWorkflow):
  - apex_export_path: applications/app_###/
  - app_ids: []
  - prereq_source: unresolved
  - db_mode: unresolved
  - db_connection_name: ""          # needed with APEX workspace name if running live DB steps
  - apex_workspace_name: ""         # corresponding APEX workspace for live DB steps
- environment: dev
- dry_run: true
- Merge rule: user overrides in the same one‑liner message replace Default values; do not invent missing fields.
- Routers should follow `references/policies/governance/prompt-normalization.md`, prefer permissive defaults such as `prompt_normalization: enabled`, and keep clarification behavior explicit instead of rejecting informal prompts.

Safeguards and gates
- Secrets hygiene: never log secrets or full connect strings.
- dry_run must remain true unless BOTH dry_run: false AND environment: dev are provided.
- For DB-backed domains, prefer the schema-first prerequisite gate: inspect `assets/workspace-intelligence.json`, use an eligible offline schema dictionary when available, then traverse saved SQLcl connections before the final clarification prompt.
- If DB work is requested and live DB context is still required after the prerequisite gate, allow the TargetWorkflow’s Pre‑Agent 0 to halt with Missing Inputs rather than fabricating a connection.
- For interactive DB-backed runs, inspect offline schema metadata and scan saved SQLcl connections before asking the user anything about DB mode.
- Use deterministic saved SQLcl connection discovery to suggest aliases before asking; require the user to specify `db_connection_name` and the corresponding APEX workspace name before live DB work. Use `Provide db_connection_name and the corresponding APEX workspace name for this workflow.` as the last clarification fallback after discovery leaves live DB context unresolved.
- No changes to templates/ content in plan-only runs; write artifacts to the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/`**.

File naming and structure
- One router contract section per domain skill:
-   - `SKILL.md`
-   - `external:oracle-db/plsql`
-   - `external:oracle-db/schema-modeling`
- Keep router contracts small and declarative; avoid copying workflow logic or artifacts lists (the workflow owns those).

Keyword design (Match)
- Use unambiguous, domain‑specific phrases that users naturally type.
- Avoid broad terms that collide across domains.
- Examples:
  - APEX Generation: [build page, interactive report, form, dashboard, application, apex generate, …]
  - PL/SQL Maintenance: [plsql maintenance, package consolidation, consolidate plsql, check plsql, …]

Examples (single message)
- Snippet class: `illustrative_prompt`. Replace any `{{...}}` variables before use; do not treat them as schema evidence.
- APEX generation (constitutional master):
  build a page with an interactive report on {{source.table}} and a form to edit; refresh report after submit
- PL/SQL maintenance (standalone):
  check entire app for all plsql code and see what can be packaged and consolidated
- PL/SQL maintenance with overrides:
  check entire app for all plsql code and see what can be packaged and consolidated
  dry_run: true

Consistency checklist (for any new “master” workflow)
- [ ] Add a `Router Contract` section to `skills/<domain>/SKILL.md`
- [ ] Set Router:true, Kind:one-message, TargetWorkflow:<path>
- [ ] Define specific Match keywords for the domain
- [ ] Provide safe Defaults appropriate for plan-only execution
- [ ] Declare or inherit the governance prompt-normalization contract (`prompt_normalization`, one clarification round, simple-English follow-up, ask-then-stop ambiguity policy)
- [ ] For DB-backed domains, declare `prereq_source`, schema-first prerequisite routing, and the canonical connection/offline prompt as the final fallback
- [ ] Add Safeguards mirroring governance (00-governance.md)
- [ ] Include concise Examples to illustrate one-liner usage

Notes
- Routers are independent of the constitutional master unless they explicitly target it (as with APEX generation).
- Keep token usage minimal: routers should reference, not duplicate, workflow content and artifacts.
- See `SKILL.md`, `references/workflows/apex-generation.md`, and `external:oracle-db/plsql` for concrete implementations.
