> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.

# Database Connection Rules — SQLcl Direct

Startup and precedence
- Always start by reading `assets/rules-mapping.json` to load the minimum relevant rules.
- Data rules are prioritized ahead of page/component generation:
  - `00-guard/`
  - `10-global/`
  - `20-data/`
  - `30-pages/`
  - `40-components/`

Connection contract
- Use `db_connection_name` as the canonical saved SQLcl connection input. Resolve workspace identity from the active runtime for existing apps; require an exact destination workspace name before new-app materialization.
- For DB-backed workflows, resolve prerequisite metadata source first:
  - inspect `assets/workspace-intelligence.json`
  - auto-select a single eligible schema dictionary
  - prompt the user to choose when multiple eligible schema dictionaries exist
  - scan saved SQLcl connections before any DB-mode prompt
  - auto-bind exactly one deterministic saved connection for live work
  - prompt the user to choose when multiple saved SQLcl connections exist
  - request manual `db_connection_name` only when saved-connection discovery cannot resolve one; require an exact workspace name only for new-app materialization or after runtime-reported ambiguity
  - treat `offline` as an explicit override when the user asks for offline-only behavior
- Record one machine-readable prerequisite state:
  - `prereq_source: schema_doc`
  - `prereq_source: saved_connection`
  - `prereq_source: user_prompt`
  - `prereq_source: unresolved`
- Record one machine-readable connection state:
  - `connection_source: saved_connection`
  - `connection_source: user_prompt`
  - `connection_source: unresolved`
- Resolve `db_mode` after deterministic discovery for interactive DB-backed runs:
  - `db_mode: online` requires a resolved `db_connection_name`
  - `db_mode: offline` is explicit and blocks live metadata/runtime work
- Do not infer offline mode.
- Treat `prereq_source: schema_doc` as sufficient for offline metadata reasoning only; live runtime/import still requires a resolved `db_connection_name`.
- Allow `prereq_source: schema_doc` and `connection_source: saved_connection` to coexist when offline schema metadata is preferred for evidence and a deterministic live connection was also discovered.

How to use SQLcl
- Support two live runtime paths:
  - resolved build-root runtime via `apex sql` from the matching local APEX source directory
  - PATH SQLcl runtime via `sql`
- Record the SQLcl version for reporting, but do not treat version alone as evidence that APEX runtime commands are available.
- Probe runtime capabilities before live APEX work and enable validate/import only when the selected runtime path is actually available.
- Resolve the matching local APEX build root from `db_connection_name` and prefer that runtime path when it is available.
- If build-root runtime is selected, run the live roundtrip from the resolved build directory with `apex sql`.
- If the local first-pass check already passed and a sandboxed build-root attempt fails before real `apex validate` / `apex import` output with filesystem/setup errors such as `EPERM`, `ENOENT`, or build-root `workdir/*` write failures, treat that as an execution-environment blocker and move directly to the real live build-root roundtrip; do not keep retrying the sandbox path for that run.
- If PATH SQLcl runtime is selected, use `sql <db_connection_name>` as the default authenticated session entrypoint.
- If the direct alias entrypoint fails, retry with `sql /nolog` and run `connect <db_connection_name>` inside that same SQLcl session before validate/import.
- Use `node tools/apexctl.mjs diagnostics resolve-build-root --db-connection-name <db_connection_name>` for diagnostics, reporting, or explicit build-root inspection.
- Use SQLcl directly for schema validation and SQL verification.
- Use SQLcl `apex` commands directly for APEXlang roundtrips.
- Prefer built-in SQLcl or direct `apex` help over repo helper wrappers when checking command syntax or capability.

Canonical roundtrip commands
- `apex sql` from the resolved local APEX build root
- `sql <db_connection_name>`
- `sql /nolog`
- `connect <db_connection_name>`
- `apex validate -input <absolute_app_path>`
- `apex import -input <absolute_app_path>`
- `apex export -applicationid <application_id> -exptype APEXLANG -split -dir <absolute_export_dir>`
- Allow validate/import only when the capability probe confirms the required commands exist in the selected runtime path.
- Do not add `-workspaceid` to the validate/import happy path. Only add it after the active SQLcl session explicitly reports multiple-workspace ambiguity and blocks the command without a workspace override. When that happens, resolve the workspace id automatically for the active `db_connection_name` and rerun immediately.
- When workspace-id resolution is in progress, send the user this exact short status sentence before continuing: `Identifying workspace ID for the DB connection, please bear with me...`
- Treat standalone bridge or wrapper execution as diagnostic only; the real SQLcl session is the source of truth when they disagree.
- Do not count sandbox-only build-root filesystem/setup failures as real validate attempts for the live retry budget; only real SQLcl/compiler outcomes should feed the fix loop.

Same-session requirement
- `apex validate` and `apex import` must run in the same authenticated SQLcl user session.
- If the session changes between validate and import, STOP and re-run validation before import.

Policy and quality gates
- Never perform live DB work if `db_connection_name` is unresolved. Require workspace input only for new-app materialization or when runtime ambiguity cannot be resolved deterministically.
- Never run live metadata validation, `apex validate`, or `apex import` in offline mode.
- Never treat APEX build-root inference or SQLcl version alone as sufficient proof that live validate/import can run.
- Ask for an environment-specific APEX build path only when automatic build-root resolution fails and the user still wants build-root runtime or diagnostics.
- For DB object creation/update gating, enforce the canonical hard-stop rule in `references/policies/memory-bank/00-guard/ai.guard.md` (`DB_CONN_REQUIRED_001`).
- Validate candidate SQL against the live schema when final output depends on real tables, views, columns, or joins.

Prompt pattern
- For interactive DB-backed workflows:
  - first run deterministic discovery: inspect offline schema dictionaries and scan saved SQLcl connections
  - if exactly one saved SQLcl connection exists, auto-bind it
  - if multiple saved SQLcl connections exist, present them as selectable options
  - use `Provide db_connection_name for this workflow.` when live DB context is still unresolved after discovery
  - accept `offline` only when the user explicitly asks for offline-only execution

Tags: db, connection, sqlcl, oracle, connect, schema, validate, apex, roundtrip
