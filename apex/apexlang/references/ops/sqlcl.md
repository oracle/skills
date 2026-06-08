---
name: sqlcl
description: APEXlang SQLcl runtime adapter for saved Oracle DB connection handling and direct APEX validate/import/export roundtrips.
---
> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.


# Skill — SQLcl

## Purpose
- Provide the APEXlang-specific SQLcl runtime adapter for this repository.
- Preserve local behavior for offline schema dictionary fallback, saved SQLcl connection discovery, runtime preflight, and same-session APEX validate/import/export roundtrips.
- Resolve saved Oracle connection aliases using `db_connection_name` and require the corresponding APEX workspace name for live APEXlang work.
- Defer generic SQLcl capabilities and best practices to Oracle upstream DB skills instead of duplicating them locally.
- Keep command knowledge inherent. Do not generate scripts or code to discover SQLcl commands.
- Oracle's upstream DB skills remain useful general references: `https://github.com/oracle/skills/tree/main/db`.
- This repository's SQLcl skill is the local APEXlang-specific SQLcl runtime adapter layered on top of that broader Oracle tooling guidance.

## Upstream Oracle DB Skills Authority
- Generic Oracle Database and SQLcl best practices come from Oracle upstream DB skills: `https://github.com/oracle/skills/tree/main/db`.
- Use the upstream `db/sqlcl` skillset for SQLcl scripting, formatting, Liquibase, DDL generation, data loading, MCP server usage, scheduler daemon, AWR, and background jobs.
- Use this local skill only as the APEXlang-specific SQLcl runtime adapter for connection discovery, capability probing, runtime preflight, and same-session APEX validate/import/export behavior.

| Generic SQLcl need | Primary reference | Local responsibility |
| --- | --- | --- |
| SQLcl scripting and command usage | Oracle upstream `db/sqlcl` | Do not duplicate; apply upstream guidance when needed |
| Formatting, DDL, data loading, Liquibase | Oracle upstream `db/sqlcl` | Route to upstream best practice |
| MCP, scheduler daemon, AWR, background jobs | Oracle upstream `db/sqlcl` | Route to upstream best practice |
| Saved connection discovery for APEXlang | This repo | Resolve user-specified `db_connection_name` and corresponding APEX workspace name |
| APEX validate/import/export roundtrip | This repo | Run preflight and same-session SQLcl runtime gates |

## Authoritative Policies
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/governance/00-governance.md`
- `assets/rules-mapping.json`
- `references/policies/memory-bank/20-data/db.connection.md`
- `references/policies/governance/prompt-normalization.md`

## Operational References
- `references/ops/shared-reference-index.md`
- `references/ops/one-message-router-contract.md`
- `references/workflows/apexlang/apexlang-execution-model.md`
- `references/ops/reusable-prompts/orchestration-master-generic.md`
- `references/ops/reusable-prompts/server-side-conditions.md`

## Execution Agents
- `references/ops/sqlcl-agents/00-connection-gate.md`

## Usage
- Honor the repo-wide prerequisite metadata gate before prompting for a DB connection:
  - inspect `assets/workspace-intelligence.json`
  - auto-select one eligible schema dictionary when exactly one exists
  - prompt the user to choose when multiple eligible schema dictionaries exist
  - scan saved SQLcl connections before any DB-mode prompt
  - use discovery to suggest saved SQLcl connection aliases, not to auto-approve live work
  - use discovery to suggest saved SQLcl connection aliases, not to auto-approve live work
  - prompt the user to choose when multiple saved SQLcl connection aliases exist
  - require the user to specify `db_connection_name` and the corresponding APEX workspace name before live metadata validation, `apex validate`, `apex import`, runtime diagnostics, or new-app materialization
  - require the user to specify `db_connection_name` and the corresponding APEX workspace name before live metadata validation, `apex validate`, `apex import`, runtime diagnostics, or new-app materialization
  - treat `offline` as an explicit override rather than the first prompt
- Load this skill alongside other domain skills when a workflow needs a live Oracle DB connection, SQL metadata validation, or a same-session APEXlang roundtrip.
- Normalize terse or fragmentary user input directly according to `references/policies/governance/prompt-normalization.md`; it is repo governance, not a SQLcl reusable prompt.
- Use `db_connection_name` as the canonical saved connection input name and `db_context.workspace.name` / `--workspace-name` as the canonical APEX workspace name location.
- For packaged-build refresh work, keep SQLcl/runtime docs version-aware but scope changes to actual runtime behavior deltas only; do not rewrite the SQLcl contract for component-local metadata changes.
- Probe both supported runtime candidates:
  - resolved build-root runtime via `apex sql` from the matching local APEX build derived from `db_connection_name`
  - PATH SQLcl runtime via `sql -name <db_connection_name>`, then legacy `sql <db_connection_name>`, then `sql /nolog` plus `connect <db_connection_name>`
- Default APEX artifact workflows to check-only; do not ask users to type import intent before the live APEXlang check.
- After the live APEXlang check passes, offer GUI/clickable choices using plain language: `Check APEXlang code` (recommended) or `Check and import APEXlang code`; include a short purpose summary for each choice, and if GUI choices are unavailable, stop after checking the code and report import as a follow-up.
- In normal user-facing responses, describe internal check-only runs as `Check APEXlang code` and import-approved runs as `Check and import APEXlang code`.
- Treat `node tools/apexctl.mjs runtime roundtrip ...` as a post-connection-gate runtime entrypoint. Interactive callers must not invoke it before deterministic metadata discovery, saved-connection discovery, and required `db_connection_name` plus APEX workspace name resolution are complete.
- Run `node tools/apexctl.mjs runtime preflight --db-connection-name <db_connection_name>` before any live validate/import/export roundtrip and treat it as the runtime capability, metadata-probe, and target-identity freezing gate.
- `node tools/apexctl.mjs runtime doctor` is the human-readable alias for a preflight-only runtime check.
- Prefer the resolved build-root runtime when it is available and runtime-capable; otherwise use the PATH SQLcl runtime.
- Packaged and source runs must execute through the same runtime executor rooted in `runtime/runtime.bundle.mjs`. The packaged launcher may verify and cache the packaged runtime artifact, but it must not redefine runtime behavior.
- Use direct SQLcl commands for live work in the selected runtime path. The canonical roundtrip then runs:
  - `apex validate -input <absolute_app_path>`
- `apex import -input <absolute_app_path>` only after the user explicitly chooses import in the post-check GUI flow
- Treat live `apex validate` as the first mandatory blocking runtime action in the roundtrip happy path, and run `apex import` immediately after it for explicit `validate-and-import` runs.
- Post-import browser/runtime verification is disabled by default in the public CLI and only runs when the caller explicitly opts in with `--require-runtime-verification`.
- Treat any post-import runtime verification findings as diagnostics: record them in runtime artifacts, but do not rewrite a successful `import_status` or `runtime_gate_status` to fail.
  - optionally `apex export -applicationid <application_id> -exptype APEXLANG -split -dir <absolute_export_dir>` only when the active runtime path confirms export support
  - when export backups are produced, create the output directory lazily and place them under `APEXLANG_OUTPUT_ROOT/apex-exports/<app>/`, not inside `applications/<app>/`
- Treat `artifacts/` as optional output only. Do not require it before connection discovery, workspace probing, validation, import, or generation; create log/report/export directories only when a run writes them.
- Treat any existing `apex-exports` path as backup/export material only. Do not use it as app source, metadata source, or app-resolution evidence unless the user explicitly asks for read-only export inspection, migration, or recovery analysis.
- For existing-app `validate-and-import` runs, resolve the live canonical numeric application id before import, preserve it as session authority, and reuse it for workspace and import targeting.
- Use a single bounded target resolver for every import-authorized run: scope the lookup to one intended workspace and return exactly one outcome (`resolved_existing_app`, `not_found_in_workspace`, `ambiguous_candidates`, or `identity_uncertain`).
- Treat target-resolution timeout or failure as a terminal import blocker. A successful live validate proves source syntax only; it does not authorize direct SQLcl import, wrapper bypass, or create-new fallback.
- Treat `update-existing` as the default import-authorized mode. If the bounded resolver returns `not_found_in_workspace`, stop the update path and require explicit `create-new` confirmation before import.
- Allow `create-new` only when the bounded resolver returned `not_found_in_workspace`; block create-new for `ambiguous_candidates` and `identity_uncertain`.
- If staged deployment metadata points at a different app id than the preserved canonical target, reconcile the staged deployment app id before import.
- If import output reports a different application id than the preserved canonical target, block the run, record the mismatch in runtime artifacts, and treat the reported target as an accidental duplicate or wrong target.
- Use `node tools/apexctl.mjs diagnostics resolve-build-root --db-connection-name <db_connection_name>` to inspect or report the resolved build root explicitly.
- Prefer SQLcl-native help and direct command execution for these operations. Do not add Python wrapper scripts for validate/import/export when the command can be run directly in the active SQLcl session.
- Before any live roundtrip, the executor may run the direct Node local first-pass check entrypoint `node tools/apexctl.mjs apexlang validate --app-path <absolute_app_path>` as an advisory helper lane, but that local check no longer blocks live check/import by itself.
- Do not use `node tools/apexctl.mjs apexlang validate` as a runtime dependency or as a wrapper fallback path inside the runtime executor.
- Treat the current runtime roundtrip as the `APEXlang source import` lane. Do not describe it to users as a generic import path when a narrower compiled SQL export import path or other alternate artifact lane is being discussed elsewhere.
- If the local first-pass check already passed and a sandboxed build-root runtime attempt fails before real `apex validate` / `apex import` output because of filesystem/setup errors such as `EPERM`, `ENOENT`, or build-root `workdir/*` write failures, stop retrying the sandbox path and escalate immediately to the real live build-root roundtrip.
- Treat runtime capability probing as the enable/disable gate for live runtime actions. A reported version without the required command capabilities is not runtime-ready.
- Validate is mandatory for every live runtime action.
- If the post-check GUI choice resolves to import, the live APEXlang check and import MUST happen in the same authenticated SQLcl user session.
- If the real SQLcl session reports multiple-workspace ambiguity, automatically resolve the workspace id for the active `db_connection_name` and restart the same-session roundtrip with a run-scoped explicit `-workspaceid` without waiting for extra user direction.
- When the workflow is actively resolving or confirming a workspace id for a DB connection, send the user this short progress update before continuing: `Identifying workspace ID for DB connection, please bare with me...`
- The runtime layer resolves the workspace id from live metadata using a dedicated helper keyed by the staged app identity and active `db_connection_name`; the helper must hard-fail when it does not reduce to exactly one workspace id.
- `runtime-run.json` and `runtime-run.log` must record the blocked ambiguity attempt, the workspace-resolution step, and the rerun outcome. A workspace-blocked first attempt is not success evidence for validate/import.
- The runtime executor is phase-based and must stop on the first failed mandatory phase: `preflight`, `target_resolve`, `live_validate`, and `import`. `local_validate` remains in the phase model as an advisory/helper stage and must report whether it ran or was skipped by roundtrip policy.
- The default runtime path validates/imports the resolved app path in place. Use transient runtime directories only for logs, stage reports, and temporary SQL scripts; do not stage and sync full app copies unless a workflow intentionally mutates artifacts before publish.
- Default `supporting_objects` is `false`. Treat bundled metadata as read-only guidance and perform live metadata inspection during preflight before validate/import work continues.
- `--import-mode auto|direct` controls import fallback. `auto` may switch once to `direct` only after the live APEXlang check passed and the failure is classified as wrapper/session-only.
