---
name: apexlang-runtime-gates
description: Canonical same-session SQLcl runtime gates for APEXlang validate/import/export workflows.
---
> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.


# Reference Package — APEXlang Runtime Gates

## Purpose
- Define the canonical runtime/import contract for APEXlang workflows.
- Standardize direct SQLcl roundtrips across all APEXlang artifact-generation skills.
- Keep validation and import in the same SQLcl user session.

## Authoritative Policies
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/governance/00-governance.md`
- `references/policies/memory-bank/20-data/db.connection.md`
- `references/ops/sqlcl.md`

## Operational References
- `references/ops/sqlcl-agents/00-connection-gate.md`
- `references/ops/runtime-gates/01-direct-sqlcl-import.md`
- `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`
- `tools/apexctl.mjs`

## Canonical Validation
1. Resolve `db_connection_name` and the corresponding APEX workspace name.
2. Run `node tools/apexctl.mjs runtime preflight --db-connection-name <db_connection_name>` and record both runtime candidates. Use `runtime doctor` when the caller wants the same preflight facts without continuing into validation/import.
3. Prefer the resolved build-root runtime via `apex sql` when the matching local APEX build derived from `db_connection_name` is available and runtime-capable; otherwise use PATH SQLcl.
4. Run validate-only through the single public agent command: `node tools/apexctl.mjs runtime validate --app-path <absolute_app_path> --db-connection-name <db_connection_name> --apex-root <resolved_build_root> [--compiler-oracle-home <compiler_metadata_home>] [--execution-mode auto|build-root|path] [--vscode-problems-path <path>]`.
5. Treat the internal validate-only roundtrip as the `APEXlang source import` lane. It validates the staged source tree and is not interchangeable with any separate compiled SQL export import path.
6. Treat preflight as a capability, live-metadata, and target-identity gate. When it successfully resolves runtime capability and live metadata, the run may continue even if the preflight stage budget was exceeded.
7. Treat live `apex validate` as the first mandatory blocking runtime action in the happy path. For APEX/ORA runtime error text with a live DB connection, if runtime was to actually be tested, query `APEX_DEBUG_MESSAGES` through `references/domains/debugging/apex-debug-messages.md` to resolve the `PAGE_VIEW_ID` execution log before assigning ownership. Route the finding through the same debug/fix/revalidate loop before import is allowed.
8. For an approved import continuation, run `node tools/apexctl.mjs runtime roundtrip --app-path <final_app_path> --db-connection-name <db_connection_name> --import-intent validate-and-import [--execution-mode auto|build-root|path]` and execute live import immediately after successful live validate. In user-facing responses, label this path as `Check and import APEXlang code`.
9. Browser/runtime verification is not a pre-import gate. Run it only after `import_status = pass`, and only when the caller explicitly requests it with `--require-runtime-verification`.
10. Treat post-import runtime verification findings as diagnostics. Record them in the transcript/report and `runtime_verification_*` fields, but do not rewrite a successful import to fail.
11. The runtime executor runs in fixed phases with immutable handoff facts: `preflight`, `local_validate`, `target_resolve`, `live_validate`, and `import`. Each phase records duration, budget, status, failure class, and next safe action in the stage report.
12. `local_validate` remains an advisory/helper phase. It records whether the local first-pass check ran or was skipped by roundtrip policy, but it is no longer the first mandatory blocker for the live roundtrip lane.
13. The default roundtrip validates/imports the resolved app path in place. Use transient runtime directories only for logs, stage reports, and temporary SQL scripts. Full app-copy staging and sync-back are reserved for workflows that intentionally mutate artifacts before publish.
14. For existing-app `validate-and-import` runs, resolve the live canonical numeric application id before import, preserve it as session authority, and reconcile staged deployment metadata to that canonical id before import-authorized runtime work continues.
15. If the local first-pass check already passed and a sandboxed build-root attempt fails before real `apex validate` / `apex import` output because of filesystem/setup errors such as `EPERM`, `ENOENT`, or build-root `workdir/*` write failures, stop sandbox retries and continue with the real live build-root roundtrip.
16. If the active runtime session explicitly reports multiple-workspace ambiguity, automatically resolve the workspace id for the active `db_connection_name` and restart the same roundtrip immediately with a run-scoped explicit `-workspaceid`.
17. Optionally run `apex export -applicationid <application_id> -exptype APEXLANG -split -dir <absolute_export_dir>` only when the selected runtime path confirms export support.
18. When export backups are produced, create the output directory lazily and write them under `APEXLANG_OUTPUT_ROOT/apex-exports/<app>/`, never under `applications/<app>/`.

## Rules
- `--apex-root` selects only the APEX/SQLcl runtime used for live validation. Use `--compiler-oracle-home` only for explicit compiler-truth metadata overrides; otherwise let compiler truth auto-discover the VS Code SQLcl/APEXlang runtime.
- The validated temp app path is always the canonical live-runtime path for the run.
- Every validation run must emit `validation-report.json`, `validation-transcript.log`, `problems.json`, and `component-contracts/<build>.json`; `problems.json` is the review interface for repair.
- Validation requires live APEX validation evidence from the selected target build. Missing required runtime inputs or missing live runtime evidence blocks completion with `LIVE_RUNTIME_VALIDATION_REQUIRED_001`.
- Compiler-truth, local lint, and VS Code Problems snapshots are diagnostics after live validation passes; missing VS Code Problems snapshots are recorded as `not_provided`, not as blockers.
- Patch only reported problems, then rerun `runtime validate` until `live_check_status = pass`.
- The frozen preflight facts are the canonical handoff for later phases. If a required fact is missing or contradictory, stop in preflight and do not continue.
- Preflight is a runtime-capability and identity gate, not a browser-debug gate.
- The runtime roundtrip assumes the connection gate already resolved `db_mode`, required `db_connection_name`, and the corresponding APEX workspace name; it is not responsible for prompting the user through the staged offline/live DB flow.
- If the post-check GUI choice resolves to `Check and import APEXlang code`, the checked and imported temp app path must match exactly.
- If the SQLcl session changes between validate and import, stop and re-run validation before import.
- If the post-check GUI choice resolves to `Check and import APEXlang code`, the preserved canonical application id becomes the only accepted target identity for the rest of the session.
- If staged deployment metadata does not match that preserved canonical application id, reconcile the staged deployment app id before import.
- If import output reports a different application id than the preserved canonical target, block the run and record the mismatch as a duplicate or wrong-target outcome.
- Treat the resolved build-root runtime as the preferred same-session runtime path and PATH SQLcl as the supported fallback.
- Record SQLcl version for reporting, but do not treat version alone as proof that runtime commands are available.
- Enable validate/import only when capability probing confirms the selected runtime path can execute the required commands for the resolved runtime action.
- Python wrappers must not own the live SQLcl validate/import/export path.
- The repo may keep heavy validator internals behind `node tools/apexctl.mjs`, but SQLcl command execution itself stays direct.
- Prefer direct SQLcl or direct `apex` command help for command shape and capability checks; do not introduce helper scripts when the live task is simply validate/import/export.
- Runtime target resolution must use structured SQL probes with explicit statement termination and machine-readable probe boundaries. SQL parse failures in target resolution are terminal and must not fall through to import retries.
- Target-resolution timeout or failure is a terminal import blocker. Live validate success only proves the staged source can compile; it must not be used to justify direct SQLcl import, wrapper bypass, or create-new fallback.
- Build-root resolution is part of the happy-path runtime selection flow when a matching local build is available.
- Default `supporting_objects` is `false`. Bundled metadata is read-only guidance. Live DB metadata inspection during preflight must win when it conflicts with bundled metadata.
- `--import-mode auto|direct` controls the import executor. `auto` may use one direct fallback only after the live APEXlang check passed and the failure was classified as wrapper/session-only.
- Runtime reports must record the default check-only intent or explicit post-check import intent/source, treat a workspace-ambiguity response as a blocked intermediate condition, record the resolution step plus resolved `workspaceid` when one is found, and only mark import as pass after the rerun succeeds in an import-approved run.
- Treat local repo validation as syntax hygiene for the live roundtrip lane unless it is generated from the same target build metadata. Record whether it ran, failed, or was skipped by roundtrip policy, but do not let it override live/compiler validation.
- Treat sandbox-only build-root filesystem/setup failures before real validate/import output as environment blockers, not app defects and not live retry-budget consumption.
- A run may attempt the live APEXlang check at most 3 times. Each failed live check attempt must route through `references/domains/README.md`, apply a concrete fix, rerun local first-pass checks, and then restart the real SQLcl session for the next attempt.
- Do not use blind unchanged retries.
- If no validate attempt succeeds after the third attempt, stop and surface the exact blocker.
- Treat `references/domains/README.md` as a failure branch, not a baseline runtime dependency.
- If local repo validators fail, stop the happy-path runtime flow and route to `references/domains/README.md`.
- If `apex validate -input <absolute_app_path>` fails, stop before import and route to `references/domains/README.md`.
- If optional post-import runtime verification reports a critical live-page failure, keep the successful import outcome intact, record the findings, and route follow-up debugging through `references/domains/debugging/runtime-ui-verification.md`.
- If runtime verification reports APEX/ORA error text and a live DB connection is available, search `APEX_DEBUG_MESSAGES`, resolve the matching `PAGE_VIEW_ID`, and use the full execution log as the debugging evidence. If multiple matches exist, ask for `PAGE_VIEW_ID` / debug id or `SESSION_ID`; if the log is sparse, ask for Full trace reproduction.
- If validate passes and `apex import -input <absolute_app_path>` fails in the same session, route to `references/domains/README.md`, then restart from validate in a fresh real SQLcl session after the fix.
- If the runtime wrapper is bypassed with a direct SQLcl fallback, the same failure rule applies: any direct `apex validate` or `apex import` compile/import error must route through `references/domains/README.md` before artifact edits continue.
- If validate/import both pass but the reported defect remains visible only in the running app, route to the runtime UI/UX verification branch in `references/domains/debugging/runtime-ui-verification.md`.
- Treat packaged-build refresh notes as source-owned guidance, not as changes to the runtime contract unless the packaged metadata proves a validate/import behavior change.
- Component-local metadata refreshes, including Interactive Grid saved-report defaults or aggregate import-path visibility changes, do not change the runtime gate flow by themselves.
- `artifacts/` is optional output only and must not be required before a runtime workflow starts. Create logs, reports, and export directories only when the run writes them.
- Runtime export backups are durable outputs, not generated app-root content or app-resolution inputs. Keep them under `APEXLANG_OUTPUT_ROOT/apex-exports/<app>/` so `applications/<app>/` remains a clean APEXlang source tree.
- Ignore any existing `apex-exports` tree during app resolution, metadata discovery, bounded scans, and generation unless the user explicitly asks for read-only export inspection, migration, or recovery analysis.

## Executable Failure Branch
- The runtime roundtrip records the caught failure stage immediately in the run summary using `failure_stage`, `debugging_bucket`, `owning_layer`, `confirming_check`, and `fix_pattern`.
- Local validator failures enter a bounded repo-local debug loop before any live SQLcl work. The loop may apply only deterministic repo-local fixes and stops after `debug_max_retry_count = 3`.
- The first executable repo-local auto-fix removes invalid `execution.event` lines from staged dynamic-action action `execution` blocks when the local first-pass check reports `execution.event must not be emitted`.
- Workspace-resolution failures, live validate failures, and live import failures also record the debugging route immediately even when no auto-fix is available.
- Direct SQLcl fallback failures must be manually recorded with the same route fields in the work summary: `failure_stage`, `debugging_bucket`, `owning_layer`, `confirming_check`, and `fix_pattern`.
- External-owner failures such as import version gates or property-model metadata failures are classified and surfaced precisely, but are not auto-patched from the runtime wrapper.
- Sandbox-only build-root filesystem/setup blockers such as `EPERM`, `ENOENT`, or `workdir/*` creation failures remain outside the debugging/fix loop and are reported as environment blockers.

## Execution Agents
- `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`
- `references/ops/runtime-gates/01-direct-sqlcl-import.md`
