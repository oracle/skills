# Agent: SQLcl Connection Gate

Purpose
- Be the first live-database gate for shared workflows in this repository.
- Resolve prerequisite metadata first, then resolve `db_connection_name` only when live DB context is required. Resolve workspace identity separately for new-app materialization or runtime-reported ambiguity.
- Keep SQLcl command usage direct and deterministic.
- Be the single source of truth for global startup/load ordering.

Canonical startup order
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/governance/00-governance.md`
- `references/policies/context-overview.md`
- `assets/rules-mapping.json`

Inputs
- `prereq_source`: `schema_doc`, `saved_connection`, `user_prompt`, or `unresolved`
- `connection_source`: `saved_connection`, `user_prompt`, or `unresolved`
- `selected_schema_name`: optional offline schema dictionary identifier
- `selected_schema_doc_path`: optional selected schema dictionary path
- `db_mode`: `online` or `offline`
- `db_connection_name`: saved SQLcl connection alias
- `apex_workspace_name`: exact destination workspace for new-app materialization, or a workspace identity resolved after runtime ambiguity
- `environment`: optional environment label

Rules
- For DB-backed workflows, inspect `assets/workspace-intelligence.json` and scan saved SQLcl connections before any prompt about DB mode or connection knowledge.
- If `db_mode = offline`, inspect `assets/workspace-intelligence.json`.
- If exactly one eligible schema dictionary exists, set `prereq_source = schema_doc`, record `selected_schema_name` plus `selected_schema_doc_path`, and skip DB prompting unless later live work requires it.
- If multiple eligible schema dictionaries exist, ask the user to choose one schema dictionary before continuing.
- If exactly one saved SQLcl connection alias is discovered, auto-bind it and record `connection_source = saved_connection`.
- If multiple saved SQLcl connection aliases are discovered, ask the user to choose one connection alias from the discovered list; record `connection_source = saved_connection` when one is chosen from that list.
- Use the final natural-language clarification prompt only when live prerequisite routing remains unresolved; record `connection_source = user_prompt` when it resolves manual `db_connection_name`: `Provide db_connection_name for this workflow.`
- If `prereq_source = saved_connection`, `prereq_source = user_prompt` with `db_mode = online`, or `db_mode = online`, a resolved `db_connection_name` is required.
- Allow `prereq_source = schema_doc` and `connection_source = saved_connection` to coexist when schema docs remain the preferred evidence source and a deterministic live connection was also resolved.
- If `prereq_source = schema_doc`, stop before live metadata validation or APEXlang roundtrips unless the workflow later escalates to live runtime work.
- If `db_mode = offline`, stop before live metadata validation or APEXlang roundtrips.
- Use natural-language prompting for manual connection entry only after deterministic discovery fails. Ask for workspace identity only for new-app materialization or unresolved runtime ambiguity.
- Do not generate code to discover SQLcl commands. Command knowledge is assumed.
- Never log secrets or full connect strings. Record only the saved connection alias when needed.
- Accept two supported runtime paths:
  - resolved build-root runtime via `apex sql`
  - PATH SQLcl runtime via `sql`
- Record SQLcl version for reporting, but do not treat version alone as runtime readiness.
- Run capability probing before live runtime work and treat build-root runtime plus PATH SQLcl runtime as candidate paths for the real enable/disable gate.
- Prefer the resolved build-root runtime when it is available and runtime-capable; otherwise use the authenticated PATH SQLcl session that tries `sql -name <db_connection_name>` first, then legacy `sql <db_connection_name>`, and falls back to `sql /nolog` plus `connect <db_connection_name>` if needed.
- Use local APEX build-root resolution as part of the normal runtime selection flow, not diagnostics only.
- Do not preemptively add workspace-id overrides to runtime commands once the alias, workspace name, and session are resolved. Workspace-id overrides are exception-only and require SQLcl to explicitly report multiple-workspace ambiguity first; once that happens, resolve the workspace id automatically for the active `db_connection_name` and rerun immediately.

Capability preflight
- Shared tooling must probe SQLcl availability, version, and APEX command support before live runtime work.
- Preflight results gate whether validate/import/export may run, but they do not replace the same-session runtime contract.

Exit criteria
- `prereq_source` is resolved and recorded for downstream use, or the workflow halts with Missing Inputs.
- `connection_source` is resolved and recorded for downstream use when live DB context is discovered, or remains `unresolved`.
- If `prereq_source = schema_doc`, `selected_schema_name` and `selected_schema_doc_path` are recorded for downstream use.
- If `db_mode = online`, `db_connection_name` is resolved and recorded for downstream use, or the workflow halts with Missing Inputs.
- For APEX runtime work, PATH SQLcl capability status is recorded for downstream use, or the workflow halts with Missing Inputs or a blocked preflight result.
- For APEX runtime work, the selected runtime path and its capability status are recorded for downstream use, or the workflow halts with Missing Inputs or a blocked preflight result.
